using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;

namespace UxServer
{
    [HubName("uxHub")]
    public class UxHub : Hub
    {
        public void UxReceive(string name, string message)
        {
            Clients.All.uXReceive(name, message);
        }
    }
}
