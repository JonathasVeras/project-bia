#[cfg(target_os = "linux")]
use std::ffi::{c_char, c_int, c_long, c_ulong};
#[cfg(target_os = "linux")]
use std::sync::Mutex;
#[cfg(target_os = "linux")]
use std::time::Duration;

#[cfg(target_os = "linux")]
use raw_window_handle::{HasWindowHandle, RawWindowHandle};
#[cfg(target_os = "linux")]
use tauri::WebviewWindow;

#[cfg(target_os = "linux")]
#[repr(C)]
struct XDisplay {
    _private: [u8; 0],
}

#[cfg(target_os = "linux")]
type Xid = u64;

#[cfg(target_os = "linux")]
const REVERT_TO_PARENT: c_int = 2;
#[cfg(target_os = "linux")]
const CURRENT_TIME: u64 = 0;

#[cfg(target_os = "linux")]
#[repr(C)]
struct XClientMessageEvent {
    type_: c_int,
    serial: c_ulong,
    send_event: c_int,
    display: *mut XDisplay,
    window: u64,
    message_type: c_ulong,
    format: c_int,
    data: [c_long; 5],
}

#[cfg(target_os = "linux")]
type Atom = c_ulong;

#[cfg(target_os = "linux")]
const CLIENT_MESSAGE: c_int = 33;
#[cfg(target_os = "linux")]
const SUBSTRUCTURE_NOTIFY_MASK: c_long = 1 << 19;
#[cfg(target_os = "linux")]
const SUBSTRUCTURE_REDIRECT_MASK: c_long = 1 << 20;

#[cfg(target_os = "linux")]
#[link(name = "X11")]
unsafe extern "C" {
    fn XOpenDisplay(name: *const c_char) -> *mut XDisplay;
    fn XDefaultRootWindow(dpy: *mut XDisplay) -> u64;
    fn XInternAtom(dpy: *mut XDisplay, name: *const c_char, only_if_exists: c_int) -> Atom;
    fn XSendEvent(
        dpy: *mut XDisplay,
        win: u64,
        propagate: c_int,
        event_mask: c_long,
        event_send: *mut XClientMessageEvent,
    ) -> c_int;
    fn XRaiseWindow(dpy: *mut XDisplay, win: u64) -> c_int;
    fn XSetInputFocus(dpy: *mut XDisplay, win: u64, revert_to: c_int, time: u64) -> c_int;
    fn XGetInputFocus(dpy: *mut XDisplay, focus: *mut u64, revert_to: *mut c_int) -> c_int;
    fn XFlush(dpy: *mut XDisplay) -> c_int;
}

#[cfg(target_os = "linux")]
struct DisplayHandle(*mut XDisplay);

#[cfg(target_os = "linux")]
unsafe impl Send for DisplayHandle {}
#[cfg(target_os = "linux")]
unsafe impl Sync for DisplayHandle {}

#[cfg(target_os = "linux")]
static DISPLAY: Mutex<Option<DisplayHandle>> = Mutex::new(None);

#[cfg(target_os = "linux")]
pub fn init() {
    let mut guard = DISPLAY.lock().unwrap();
    if guard.is_none() {
        unsafe {
            *guard = Some(DisplayHandle(XOpenDisplay(std::ptr::null())));
        }
    }
}

#[cfg(target_os = "linux")]
fn window_xid(window: &WebviewWindow) -> Option<Xid> {
    match window.window_handle().ok()?.as_raw() {
        RawWindowHandle::Xlib(h) => Some(h.window),
        RawWindowHandle::Xcb(h) => Some(h.window.get() as u64),
        _ => None,
    }
}

#[cfg(target_os = "linux")]
fn focus_once(xid: Xid) {
    let guard = DISPLAY.lock().unwrap();
    if let Some(DisplayHandle(dpy)) = *guard {
        unsafe {
            let root = XDefaultRootWindow(dpy);
            let net_active = XInternAtom(
                dpy,
                c"_NET_ACTIVE_WINDOW".as_ptr(),
                0,
            );
            let mut ev = XClientMessageEvent {
                type_: CLIENT_MESSAGE,
                serial: 0,
                send_event: 1,
                display: dpy,
                window: xid,
                message_type: net_active,
                format: 32,
                data: [2, 0, xid as c_long, 0, 0],
            };
            XSendEvent(
                dpy,
                root,
                0,
                SUBSTRUCTURE_REDIRECT_MASK | SUBSTRUCTURE_NOTIFY_MASK,
                &mut ev,
            );
            XRaiseWindow(dpy, xid);
            XSetInputFocus(dpy, xid, REVERT_TO_PARENT, CURRENT_TIME);
            XFlush(dpy);
        }
    }
}

#[cfg(target_os = "linux")]
fn is_focused(xid: Xid) -> bool {
    let guard = DISPLAY.lock().unwrap();
    if let Some(DisplayHandle(dpy)) = *guard {
        let mut focus: Xid = 0;
        let mut revert: c_int = 0;
        unsafe {
            XGetInputFocus(dpy, &mut focus, &mut revert);
        }
        return focus == xid;
    }
    false
}

#[cfg(target_os = "linux")]
pub fn focus_window(window: &WebviewWindow) {
    let Some(xid) = window_xid(window) else {
        return;
    };
    for _ in 0..5 {
        focus_once(xid);
        if is_focused(xid) {
            break;
        }
        std::thread::sleep(Duration::from_millis(100));
    }
}

#[cfg(not(target_os = "linux"))]
pub fn focus_window(_window: &tauri::WebviewWindow) {}

#[cfg(not(target_os = "linux"))]
pub fn init() {}
