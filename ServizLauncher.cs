using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;
using System.Drawing;
using System.Threading;

namespace ServizLauncher
{
    static class Program
    {
        private static Process serverProcess;
        private static NotifyIcon trayIcon;
        private static string projectDir;
        private static ManualResetEvent exitEvent = new ManualResetEvent(false);

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            projectDir = AppDomain.CurrentDomain.BaseDirectory;
            
            try
            {
                // 1. Install dependencies if missing (First-run Setup)
                if (!Directory.Exists(Path.Combine(projectDir, "node_modules")))
                {
                    ShowInstallProgress();
                }

                // 2. Setup Auto-Startup Shortcut
                EnsureStartupShortcut();

                // 3. Start Next.js server in the background
                StartNextServer();

                // 4. Create System Tray Icon
                CreateTrayIcon();

                // 5. Open Browser to http://localhost:3000
                OpenBrowser();

                // Start Windows Forms message loop in a separate STA thread so it doesn't block the main thread.
                Thread winFormsThread = new Thread(() => {
                    try
                    {
                        Application.Run();
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("WinForms message loop error: " + ex.Message);
                    }
                });
                winFormsThread.SetApartmentState(ApartmentState.STA);
                winFormsThread.Start();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Грешка при стартиране: " + ex.Message, "Грешка", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }

            // Keep the process alive
            exitEvent.WaitOne();
        }

        static void ShowInstallProgress()
        {
            MessageBox.Show(
                "Първоначално стартиране: Инсталиране на зависимостите и подготовка на базата данни.\n\nТова може да отнеме 1-2 минути. Моля, изчакайте съобщението за завършване.", 
                "Инсталация на Сервиз за Ремонти", 
                MessageBoxButtons.OK, 
                MessageBoxIcon.Information
            );

            // Run npm install
            RunCommand("cmd.exe", "/c npm install", true);

            // Run prisma db push
            RunCommand("cmd.exe", "/c npx prisma db push", true);

            // Run npm run build
            RunCommand("cmd.exe", "/c npm run build", true);

            MessageBox.Show(
                "Инсталацията приключи успешно! Сървърът ще се стартира сега.", 
                "Успешна инсталация", 
                MessageBoxButtons.OK, 
                MessageBoxIcon.Information
            );
        }

        static void RunCommand(string fileName, string arguments, bool wait)
        {
            ProcessStartInfo psi = new ProcessStartInfo(fileName, arguments)
            {
                WorkingDirectory = projectDir,
                WindowStyle = ProcessWindowStyle.Hidden,
                UseShellExecute = true
            };
            
            Process proc = Process.Start(psi);
            if (wait && proc != null)
            {
                proc.WaitForExit();
            }
        }

        static void EnsureStartupShortcut()
        {
            try
            {
                string startupFolder = Environment.GetFolderPath(Environment.SpecialFolder.Startup);
                string shortcutPath = Path.Combine(startupFolder, "serviz-remonti.lnk");

                if (!File.Exists(shortcutPath))
                {
                    string currentExe = Process.GetCurrentProcess().MainModule.FileName;
                    string escapedShortcut = shortcutPath.Replace("'", "''");
                    string escapedExe = currentExe.Replace("'", "''");
                    string escapedDir = projectDir.Replace("'", "''");
                    string psCommand = string.Format(
                        "$s=(New-Object -COM WScript.Shell).CreateShortcut('{0}');$s.TargetPath='{1}';$s.WorkingDirectory='{2}';$s.Save()",
                        escapedShortcut, escapedExe, escapedDir
                    );

                    ProcessStartInfo psi = new ProcessStartInfo("powershell.exe", "-NoProfile -ExecutionPolicy Bypass -Command \"" + psCommand + "\"")
                    {
                        WorkingDirectory = projectDir,
                        WindowStyle = ProcessWindowStyle.Hidden,
                        UseShellExecute = true
                    };
                    Process.Start(psi).WaitForExit();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Could not create startup shortcut: " + ex.Message);
            }
        }

        static void StartNextServer()
        {
            ProcessStartInfo psi = new ProcessStartInfo("cmd.exe", "/c npm run start")
            {
                WorkingDirectory = projectDir,
                WindowStyle = ProcessWindowStyle.Hidden,
                UseShellExecute = true
            };

            serverProcess = Process.Start(psi);
            
            // Wait 3.5 seconds for Next.js to boot up
            Thread.Sleep(3500);
        }

        static void OpenBrowser()
        {
            try
            {
                Process.Start(new ProcessStartInfo("http://localhost:3000") { UseShellExecute = true });
            }
            catch
            {
                // Fallback for launch if UseShellExecute fails
                Process.Start("cmd.exe", "/c start http://localhost:3000");
            }
        }

        static void CreateTrayIcon()
        {
            try
            {
                ContextMenu contextMenu = new ContextMenu();
                contextMenu.MenuItems.Add("Отвори в браузъра", (s, e) => OpenBrowser());
                contextMenu.MenuItems.Add("Рестартирай сървъра", (s, e) => {
                    StopServer();
                    StartNextServer();
                    OpenBrowser();
                });
                contextMenu.MenuItems.Add("-");
                contextMenu.MenuItems.Add("Изход", (s, e) => ExitApp());

                trayIcon = new NotifyIcon
                {
                    Icon = SystemIcons.Application,
                    ContextMenu = contextMenu,
                    Text = "Сервиз за ремонт - Активен",
                    Visible = true
                };

                trayIcon.DoubleClick += (s, e) => OpenBrowser();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Could not create system tray icon (might be headless mode): " + ex.Message);
            }
        }

        static void StopServer()
        {
            if (serverProcess != null && !serverProcess.HasExited)
            {
                try
                {
                    ProcessStartInfo killPsi = new ProcessStartInfo("taskkill", string.Format("/F /T /PID {0}", serverProcess.Id))
                    {
                        CreateNoWindow = true,
                        UseShellExecute = false
                    };
                    Process.Start(killPsi).WaitForExit();
                }
                catch
                {
                    serverProcess.Kill();
                }
            }
        }

        static void ExitApp()
        {
            StopServer();
            if (trayIcon != null)
            {
                try
                {
                    trayIcon.Visible = false;
                    trayIcon.Dispose();
                }
                catch {}
            }
            exitEvent.Set();
            Application.Exit();
        }
    }
}
