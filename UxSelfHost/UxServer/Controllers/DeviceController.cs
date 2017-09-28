using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Http;
using System.Xml;
using NEXTEP.Log;
using NEXTEP.UX.Properties;

namespace UxServer.Controllers
{
    public class DeviceController : ApiController
    {

        public enum DeviceType : int
        {
            Kiosk = 0
        }

        // GET api/demo 
        public IEnumerable<string> Get()
        {
            return new string[] { "Hello", "World" };
        }

        public string ComputerName()
        {
            return GetComputerName();
        }

        private string GetComputerName()
        {
            string computerName = Environment.MachineName;
            try
            {
                string fileName = SettingsFile();
                if (fileName.Length > 0)
                {
                    string settingsPath = Path.Combine(Settings.Default.wwwPath, fileName);
                    if (File.Exists(settingsPath))
                    {
                        XmlDocument settings = new XmlDocument();
                        settings.Load(settingsPath);
                        if (settings.DocumentElement != null)
                        {
                            computerName = settings.DocumentElement.GetAttribute("pcid");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Logger.Publish(ex);
            }

            return computerName;
        }

        public string ThemeMediaPath()
        {
            string themePath = Settings.Default.ThemeMediaPath;
            themePath = (themePath.Length > 0) ? themePath : (Settings.Default.DebugMode) ? "Themes/" : "../../Themes";
            if (!themePath.EndsWith("/"))
            {
                themePath += "/";
            }
            return themePath;
        }

        public string DefaultTheme()
        {
            string defaultThemeName = string.Empty;
            try
            {
                string mediaPath = (ThemeMediaPath().Length > 1) ? Path.Combine(Settings.Default.wwwPath, ThemeMediaPath()) : Path.Combine(Settings.Default.wwwPath, @"..\..\Themes");
                string[] themes = Directory.GetDirectories(mediaPath);

                if (themes.Length > 0)
                {
                    if (themes[0].ToLower().EndsWith("config") ||
                        themes[0].ToLower().EndsWith("font") ||
                        themes[0].ToLower().EndsWith("fonts") ||
                        themes[0].ToLower().EndsWith("media") ||
                        themes[0].ToLower().EndsWith("wpf"))
                    {
                        defaultThemeName = Path.GetFileName(Path.GetDirectoryName(mediaPath));
                    }
                    else
                    {
                        defaultThemeName = themes[0].Replace(mediaPath, "").Replace(Path.DirectorySeparatorChar, ' ').Trim();
                    }
                }
            }
            catch (Exception ex)
            {
                Logger.Publish(ex);
            }

            return defaultThemeName;
        }


    
        private string SettingsFile()
        {
            return "settings.xml";
        }


    
    }
}
