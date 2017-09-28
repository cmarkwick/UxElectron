using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.RegularExpressions;
using System.Web.Http;
using System.Xml;
using AspNetSelfHostDemo.Properties;
using Microsoft.Web.Services3.Security;
using NEXTEP.UX.JSInterop;

namespace AspNetSelfHostDemo
{
    public class DemoController : ApiController
    {
        private static TcpClient _tcp;
        private Encoding _enc = Encoding.GetEncoding("utf-8");
        private static bool _isConnected;
        private byte[] _buffer;
        private StringBuilder _dataReceived;
        private string _jsonResult;

        private const int BUFFERSIZE = 8192;

        //public DemoController()
        //{
        //    Connect();
        //}
        // GET api/demo
        public IEnumerable<string> Get()
        {
            return new string[] { "Hello", "World" };
        }

      
        [HttpPost]
        public string GetMessage(string command, [FromBody]object msg)
        {
            Connection connection = new Connection();
            
            string jsonCommand = msg.ToString();
            string response = string.Empty;

            if (jsonCommand.Length > 0)
            {
                JsonXmlConverter converter = new JsonXmlConverter();
                string requestXml = converter.JSONtoXML(jsonCommand, command);
                connection.send(command, requestXml);

                Connection.ReceiveDone.WaitOne();

            }

            //send(command, msg.ToString());
            //BeginRead();
            XmlDocument xmlDoc = new XmlDocument();
            xmlDoc.LoadXml(response);
            return new JsonXmlConverter().XMLtoJSON(xmlDoc, true); ;
        }


    }
}
