#[cfg(any(target_os = "macos", target_os = "linux"))]
use std::process::{Child, Command as ProcessCommand};
use std::sync::Mutex;

#[derive(Default)]
pub struct SleepInhibitor {
    state: Mutex<SleepInhibitorState>,
}

#[derive(Default)]
struct SleepInhibitorState {
    active_count: u32,
    guard: Option<PlatformSleepGuard>,
}

impl SleepInhibitor {
    pub fn acquire(&self) {
        let mut state = self.state.lock().unwrap();
        state.active_count = state.active_count.saturating_add(1);

        if state.active_count == 1 {
            match PlatformSleepGuard::new() {
                Ok(guard) => {
                    state.guard = Some(guard);
                }
                Err(error) => {
                    eprintln!("Could not prevent system sleep: {error}");
                }
            }
        }
    }

    pub fn release(&self) {
        let mut state = self.state.lock().unwrap();

        if state.active_count == 0 {
            return;
        }

        state.active_count -= 1;

        if state.active_count == 0 {
            state.guard.take();
        }
    }

    pub fn release_all(&self) {
        let mut state = self.state.lock().unwrap();
        state.active_count = 0;
        state.guard.take();
    }
}

struct PlatformSleepGuard {
    inner: PlatformSleepGuardInner,
}

enum PlatformSleepGuardInner {
    #[cfg(target_os = "windows")]
    Windows {
        stop_tx: std::sync::mpsc::Sender<()>,
        handle: Option<std::thread::JoinHandle<()>>,
    },
    #[cfg(any(target_os = "macos", target_os = "linux"))]
    Child(Child),
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    Unsupported,
}

impl PlatformSleepGuard {
    fn new() -> Result<Self, String> {
        #[cfg(target_os = "windows")]
        {
            return Self::new_windows();
        }

        #[cfg(target_os = "macos")]
        {
            return Self::new_process("caffeinate", &["-dimsu"]);
        }

        #[cfg(target_os = "linux")]
        {
            return Self::new_process(
                "systemd-inhibit",
                &[
                    "--what=sleep",
                    "--why=LoConvert is converting files",
                    "--mode=block",
                    "sleep",
                    "infinity",
                ],
            );
        }

        #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
        {
            Ok(Self {
                inner: PlatformSleepGuardInner::Unsupported,
            })
        }
    }

    #[cfg(target_os = "windows")]
    fn new_windows() -> Result<Self, String> {
        let (stop_tx, stop_rx) = std::sync::mpsc::channel();
        let handle = std::thread::Builder::new()
            .name("loconvert-sleep-inhibitor".to_string())
            .spawn(move || {
                use windows::Win32::System::Power::{
                    SetThreadExecutionState, ES_CONTINUOUS, ES_SYSTEM_REQUIRED,
                };

                unsafe {
                    let _ = SetThreadExecutionState(ES_CONTINUOUS | ES_SYSTEM_REQUIRED);
                }

                let _ = stop_rx.recv();

                unsafe {
                    let _ = SetThreadExecutionState(ES_CONTINUOUS);
                }
            })
            .map_err(|error| format!("could not start Windows sleep inhibitor: {error}"))?;

        Ok(Self {
            inner: PlatformSleepGuardInner::Windows {
                stop_tx,
                handle: Some(handle),
            },
        })
    }

    #[cfg(any(target_os = "macos", target_os = "linux"))]
    fn new_process(command: &str, args: &[&str]) -> Result<Self, String> {
        let child = ProcessCommand::new(command)
            .args(args)
            .spawn()
            .map_err(|error| format!("could not start {command}: {error}"))?;

        Ok(Self {
            inner: PlatformSleepGuardInner::Child(child),
        })
    }
}

impl Drop for PlatformSleepGuard {
    fn drop(&mut self) {
        match &mut self.inner {
            #[cfg(target_os = "windows")]
            PlatformSleepGuardInner::Windows { stop_tx, handle } => {
                let _ = stop_tx.send(());

                if let Some(handle) = handle.take() {
                    let _ = handle.join();
                }
            }
            #[cfg(any(target_os = "macos", target_os = "linux"))]
            PlatformSleepGuardInner::Child(child) => {
                let _ = child.kill();
                let _ = child.wait();
            }
            #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
            PlatformSleepGuardInner::Unsupported => {}
        }
    }
}
