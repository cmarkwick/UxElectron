using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web.Http;
using System.Xml;
using Microsoft.AspNet.SignalR;
using NEXTEP.Common.Utilities;
using NEXTEP.UX.Properties;
using NEXTEP.Log;

namespace UxServer.Controllers
{
    public class ConnectionController : ApiController
    {

        //private ChromiumWebBrowser _browser;
        private const int BUFFERSIZE = 8192;
        private Encoding _enc = Encoding.GetEncoding("utf-8");
        private static TcpClient _tcp;
        private byte[] _buffer;
        private StringBuilder _dataReceived;
        private static bool _isConnected;


        public IEnumerable<string> Get()
        {
            return new string[] {"Hello", "World"};
        }

        [HttpPost]
        [Route("api/connection/sendCommand/{commandName}")]
        public IHttpActionResult SendCommand([FromBody]string jsonCommand, string commandName)
        {
            try
            {
                if (_isConnected)
                {
                    lock (_enc)
                    {
                        if (jsonCommand.Length > 0)
                        {
                            JsonXmlConverter converter = new JsonXmlConverter();
                            string requestXml = converter.JSONtoXML(jsonCommand, commandName);
                            requestXml += "\0";
                            byte[] data = _enc.GetBytes(requestXml);
                            _tcp.Client.Send(data);
                        }
                    }
                }
            }
            catch (Exception e)
            {
                System.Console.WriteLine("Error sending: " + e.ToString());
            }

            return Ok();
        }


        private bool IsConnected()
        {
            return _isConnected;
        }

        [HttpPost]

        public void Connect()
        {
            if (!_isConnected)
            {
                OpenConnection(Settings.Default.ClientAddress, Settings.Default.ClientPort);
            }
        }

        [HttpPost]
        private void Close()
        {
            if (_isConnected)
            {
                _tcp.Close();
                _tcp = null;
            }
            _isConnected = false;
        }

        private bool OpenConnection(string addr, string port)
        {
            bool retn = true;
            try
            {
                if (!_isConnected)
                {
                    IPAddress address = IPAddress.Parse(addr);
                    _tcp = new TcpClient();
                    _tcp.Connect(address, Convert.ToInt32(port));

                    _isConnected = true;
                    BeginRead();
                }
                else
                {
                    _tcp.Close();
                    _tcp = null;

                    _isConnected = false;
                }
            }
            catch (Exception ex)
            {
                retn = false;
            }

            return retn;
        }

        private void BeginRead()
        {
            _buffer = new byte[BUFFERSIZE];
            _tcp.Client.BeginReceive(_buffer, 0, _buffer.Length, 0, new AsyncCallback(Receive), _tcp);
        }

        protected void Receive(IAsyncResult ar)
        {
            try
            {
                Socket sClient = ((TcpClient) ar.AsyncState).Client;
                if ((sClient != null))
                {
                    try
                    {
                        int bytesRead = sClient.EndReceive(ar);

                        if (bytesRead > 0)
                        {
                            if (_dataReceived == null)
                            {
                                _dataReceived = new StringBuilder();
                            }

                            _dataReceived.Append(_enc.GetString(_buffer, 0, bytesRead));

                            string data = _dataReceived.ToString();

                            try
                            {
                                int msgDelim = data.IndexOf('\0');
                                while (msgDelim >= 0)
                                {
                                    string xml = data.Substring(0, msgDelim);

                                    try
                                    {
                                        // At this point, the complete message has arrived from the Client manager
                                        // and is ready to be processed. For now, need to take some action to create and/or maintain
                                        // the logical connection and optionally send information back up to the HTML.
                                        XmlDocument xmlDoc = new XmlDocument();
                                        xmlDoc.LoadXml(xml);
                                        string result = new JsonXmlConverter().XMLtoJSON(xmlDoc, true);
                                        //// send the json to javascript
                                        string script = Regex.Replace(result, "(\"(?:[^\"\\\\]|\\\\.)*\")|\\s+", "$1");
                                        IHubContext hubContext = GlobalHost.ConnectionManager.GetHubContext<UxHub>();
                                        hubContext.Clients.All.uXReceive("server", script);
                                        //if (_browser.IsBrowserInitialized)
                                        //{
                                        //    _browser.ExecuteScriptAsync(script);
                                        //}

                                    }
                                    catch (SocketException se)
                                    {
                                        Logger.Publish(se);
                                        //Reconnect();
                                    }

                                    int startIndex = msgDelim + 1;
                                    msgDelim = -1;
                                    data = (startIndex < data.Length) ? data.Substring(startIndex) : null;
                                    if (data != null)
                                    {
                                        msgDelim = data.IndexOf('\0', 0);
                                    }
                                }

                                _dataReceived = new StringBuilder();
                                if (data != null)
                                {
                                    _dataReceived.Append(data);
                                }
                            }
                            catch (Exception e) //TODO: (XmlCommandException xce)
                            {
                                Logger.Publish(e);
                                _dataReceived = new StringBuilder();
                            }

                            this.BeginRead();
                        }
                        else if (bytesRead == 0)
                        {
                            _isConnected = false;
                            //if (!_shutdown)
                            //{
                            //    Clients.RemoveKiosk(this.Key);
                            //    Logger.Publish(LogLevel.Informational, "The Flash Movie has disconnected.");
                            //}
                        }
                    }
                    catch (SocketException se)
                    {
                        //Logger.Publish(LogLevel.Informational, "Client {0} has disconnected.", _ipAddress);
                        Logger.Publish(LogLevel.Informational, "Socket error code: {0}", se.ErrorCode);
                        //Clients.RemoveKiosk(this.Key);
                    }
                    catch (Exception ex)
                    {
                        Logger.Publish(ex);
                        //Clients.RemoveKiosk(this.Key);
                    }
                }
            }
            catch (Exception ex)
            {
                //Clients.RemoveKiosk(this.Key);
                Logger.Publish(ex);
            }
        }
    }
}
