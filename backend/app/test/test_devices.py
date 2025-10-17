import ctypes

dll = ctypes.windll.LoadLibrary(r"C:\secugen_sdk\bin\x64\sgfplib.dll")
hFPM = ctypes.c_void_p()
print("Create:", dll.SGFPM_Create(ctypes.byref(hFPM)))
print("Init:", dll.SGFPM_Init(hFPM, 255))

if hasattr(dll, "SGFPM_GetNumDevices"):
    num = ctypes.c_int()
    dll.SGFPM_GetNumDevices(ctypes.byref(num))
    print("Devices detected:", num.value)
else:
    print("SGFPM_GetNumDevices not available")

for i in range(5):
    res = dll.SGFPM_OpenDevice(hFPM, i)
    print(f"OpenDevice({i}) ->", res)
    if res == 0:
        dll.SGFPM_CloseDevice(hFPM)

dll.SGFPM_Terminate(hFPM)
