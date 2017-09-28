using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml;
using System.Web;
using NEXTEP.JsonParser;
using NEXTEP.Log;

namespace AspNetSelfHostDemo
{
    public class JsonXmlConverter
    {
        public JsonXmlConverter()
        {
        }

        #region JSON to XML
        public string JSONtoXML(string json, string rootElement)
        {
            string xml = string.Empty;
            try
            {
                StringBuilder sb = new StringBuilder();
                XmlWriterSettings settings = new XmlWriterSettings();
                settings.OmitXmlDeclaration = true;
                XmlWriter writer = XmlTextWriter.Create(sb, settings);

                JsonParser parser = new JsonParser(new StringReader(json), true);
                JsonObject jsonObj = new JsonObject();
                jsonObj = parser.ParseObject();

                ParseJson(writer, jsonObj, rootElement);

                writer.Close();

                xml = sb.ToString();
            }
            catch (Exception ex)
            {
                Logger.Publish(ex);
            }

            return xml;
        }

        private void ParseJson(XmlWriter writer, JsonObject json, string elementName)
        {
            Stack<string> propertyName = new Stack<string>();

            writer.WriteStartElement(elementName);
            foreach (KeyValuePair<string, IJsonType> obj in json)
            {
                if (obj.Value is JsonObject)
                {
                    ParseJson(writer, (JsonObject)obj.Value, obj.Key);
                }
                else if (obj.Value is JsonArray)
                {
                    JsonArray array = (JsonArray)obj.Value;
                    for (int i = 0; i < array.Count; i++)
                    {
                        ParseJson(writer, (JsonObject)array[i], obj.Key);
                    }
                }
                else
                {
                    ParseJsonType(writer, obj.Value, obj.Key);
                }
            }
            writer.WriteEndElement();
          
        }

        private void ParseJsonType(XmlWriter writer, IJsonType json, string attributeName)
        {
            if (json is JsonString)
            {
                writer.WriteAttributeString(attributeName, ((IJsonString)json).Value.ToString());
            }
            else if (json is JsonBoolean)
            {
                writer.WriteAttributeString(attributeName, ((IJsonBoolean)json).Value.ToString());
            }
            else if (json is JsonNumber)
            {
                writer.WriteAttributeString(attributeName, ((IJsonNumber)json).Value.ToString());
            }
        }

        #endregion

        #region XML to JSON
        public string XMLtoJSON(XmlDocument xml)
        {
            return WriteElement(xml.DocumentElement);
        }

        public string XMLtoJSON(XmlDocument xml, bool includeRoot)
        {
            string json = XMLtoJSON(xml);
            if (includeRoot)
            {
                StringBuilder sb = new StringBuilder();
                sb.Append("{");
                sb.Append(string.Format("\"name\":\"{0}\",", xml.DocumentElement.LocalName));
                sb.Append(string.Format("\"{0}\":{1}", xml.DocumentElement.LocalName, json));
                sb.Append("}");

                json = sb.ToString();
            }
            return json;
        }

        private string WriteElement(XmlElement element)
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("{");
            WriteAttributes(element, sb);

            if ((element.Attributes.Count > 0) &&
               (element.ChildNodes.Count > 0))
            {
                sb.Append(",");
            }

            WriteChildren(element, sb);
            sb.Append("}");

            return sb.ToString();
        }

        private string WriteText(XmlText text)
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("{");
            sb.Append(string.Format("\"value\":\"{0}\"", System.Web.HttpUtility.HtmlEncode(text.InnerText.Replace("\n", "~").Replace("\r", "~"))));
            sb.Append("}");
            return sb.ToString();
        }

        private void WriteChildren(XmlElement parent, StringBuilder sb)
        {
            Dictionary<string, List<string>> children = new Dictionary<string, List<string>>();

            // organize elements
            foreach (XmlNode child in parent.ChildNodes)
            {
                if (child is XmlElement)
                {
                    if (!children.ContainsKey(child.LocalName))
                    {
                        children.Add(child.LocalName, new List<string>());
                    }

                    children[child.LocalName].Add(WriteElement((XmlElement)child));
                }
                else if (child is XmlText)
                {
                    if (!children.ContainsKey("TEXT"))
                    {
                        children.Add("TEXT", new List<string>());
                    }
                    children["TEXT"].Add(WriteText((XmlText)child));
                }
            }

            string[] keys = new string[children.Keys.Count];
            children.Keys.CopyTo(keys, 0);

            for (int i = 0; i < keys.Length; i++)
            {
                if (i > 0) sb.Append(",");

                List<string> jsonElement = children[keys[i]];

                if ((jsonElement.Count > 1) || (parent.GetAttribute("childarray").ToLower() == "true"))
                {
                    sb.Append(string.Format("\"{0}\" : [", keys[i]));

                    for (int j = 0; j < jsonElement.Count; j++)
                    {
                        if (j > 0) sb.Append(",");
                        sb.Append(jsonElement[j]);
                    }
                    sb.Append("]");
                }
                else
                {
                    sb.Append(string.Format("\"{0}\": {1}", keys[i], jsonElement[0]));
                }
            }
        }

        private void WriteAttributes(XmlElement element, StringBuilder sb)
        {
            int attrCount = 0;
            foreach (XmlAttribute attr in element.Attributes)
            {
                string encodedValue = HttpUtility.HtmlEncode(attr.Value.Replace("\n", "").Replace("\r", ""));
                if (attrCount > 0) sb.Append(",");
                sb.Append(string.Format("\"{0}\" : \"{1}\"", attr.Name, encodedValue));
                attrCount++;
            }
        }
        #endregion 
    }
}
