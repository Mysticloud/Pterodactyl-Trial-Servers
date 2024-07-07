import React from "react";
import { useParams } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import useWebSocket from "react-use-websocket";
import 'xterm/css/xterm.css';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { FiDownload } from "react-icons/fi";
import { bytesCalc, cpuCalc, formatActiveTime, megabytesCalc } from "../utils/parse";

export default function ServerControl() {
  let { serverId } = useParams();
  
  const xtermRef = React.useRef(null)
  const [xtermTerminal, setXtermTerminal] = React.useState(null);
  const [resourceUsage, setResourceUsage] = React.useState(Object());
  const [currentServer, setCurrentServer] = React.useState(null);
  const [currentConsoleInput, setCurrentConsoleInput] = React.useState('');
  const [serverFetchingStatus, setServerFetchingStatus] = React.useState(true);

  const { sendJsonMessage, readyState } = useWebSocket(currentServer?.websocket?.socket, {
    onOpen: (event) => sendToConsole({"event":"auth","args":[currentServer?.websocket?.token]}),
    onMessage: (event) => handleConsole(event)
  });

  const sendToConsole = React.useCallback((console) => sendJsonMessage(console), []);

  async function handleConsole(event) {
    if (event?.data !== null) {
      try {
        const wsData = JSON.parse(event?.data)
        if ((wsData?.event == "token expiring") || (wsData?.event == "token expired")) {
          document.location.reload()
        } else if (wsData?.event == 'jwt error') {
          sendToConsole({"event":"auth","args":[currentServer?.websocket?.token]})
        } else if (wsData?.event == 'auth success') {
          sendToConsole({"event":"send logs","args":[null]})
          sendToConsole({"event":"send stats","args":[null]})
        } else if (wsData?.event == 'stats') {
          setResourceUsage(JSON.parse(wsData?.args[0]))
        } else if (((wsData?.event == 'console output') || (wsData?.event == 'install output')) && (xtermRef.current)) {
          xtermTerminal.writeln(wsData?.args[0])
          xtermRef.current
        }
      } catch {}
    }
  }

  async function downloadFiles() {
    setServerFetchingStatus(true)
    var trialServers = Object({})
    try {
      trialServers = JSON.parse(localStorage.getItem('trialServers') || "{}")
    } catch {}
    const serverHash = trialServers[serverId]
    if (serverHash == null) {
      return document.location.assign('/')
    }
    try {
      const downloadResponse = await fetch(`/api/server/${serverId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serverHash}`
        }
      })
      if (downloadResponse.status != 200) { 
        return document.location.assign('/')
      }
      const downloadURL = await downloadResponse.json()
      window.open(downloadURL?.url, '_blank');
    } catch { }
    setServerFetchingStatus(false)
  }

  React.useEffect(() => {
    const terminal = new Terminal({
      fontSize: 14,
      fontFamily: 'ui-monospace, monospace'
    });
    setXtermTerminal(terminal)
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(xtermRef.current);
    fitAddon.fit();

    terminal.onKey(e => {
      e.domEvent.preventDefault();
    });

    return () => {
      terminal.dispose();
    };
  }, []);

  React.useEffect(() => {
    setServerFetchingStatus(true)
    var trialServers = Object({})
    try {
      trialServers = JSON.parse(localStorage.getItem('trialServers') || "{}")
    } catch {}
    const serverHash = trialServers[serverId]
    if (serverHash == null) {
      return document.location.assign('/')
    }
    fetch(`/api/server/${serverId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serverHash}`
      }
    })
      .then((data) => { if (data.status != 200) { return document.location.assign('/') } else { return data } })
      .then((data) => data.json())
      .then((data) => {setCurrentServer(data); setServerFetchingStatus(false)})
      .catch((error) => {setCurrentServer(Object({})); setServerFetchingStatus(false)});
  }, []);

  const statusColors = {
    'running': 'var(--bs-green)',
    'online': 'var(--bs-green)',
    'starting': 'var(--bs-orange)',
    'stopping': 'var(--bs-gray)',
    'offline': 'var(--bs-danger)'
  }

  const resourceValues = [
    {
      name: 'Address',
      value: `${(currentServer?.allocations[0]?.ip_alias == null) ? currentServer?.allocations[0]?.ip : currentServer?.allocations[0]?.ip_alias}:${currentServer?.allocations[0]?.port}`,
      fontSize: 16
    },
    {
      name: 'CPU Load',
      value: cpuCalc(resourceUsage?.cpu_absolute),
      max: cpuCalc(currentServer?.limits?.cpu, true)
    },
    {
      name: 'Memory',
      value: bytesCalc(resourceUsage?.memory_bytes),
      max: bytesCalc(resourceUsage?.memory_limit_bytes, true),
    },
    {
      name: 'Disk',
      value: bytesCalc(resourceUsage?.disk_bytes),
      max: megabytesCalc(currentServer?.limits?.disk, true)
    },
    {
      name: 'Network (Inbound)',
      value: bytesCalc((resourceUsage?.network?.tx_bytes)),
    },
    {
      name: 'Network (Outbound)',
      value: bytesCalc(resourceUsage?.network?.rx_bytes),
    },
    {
      name: 'Uptime',
      value: formatActiveTime(new Date(new Date().getTime() - resourceUsage?.uptime)),
      fontSize: 18
    }, // my brain cell count - mystical.
  ]

  return (
    <>
      <div id="wrapper">
        <div
          style={{
            display:
            serverFetchingStatus ? "flex" : "none",
            zIndex: "99999999999",
          }}
          id="de-loader"
        ></div>

        <Header />

        <div className="no-bottom no-top" id="content">
          <div id="top"></div>

          <section id="subheader" className="jarallax console_header">
            <div className="de-gradient-edge-bottom"></div>
            <img
              src="/images/background/subheader-game.webp"
              className="jarallax-img"
              alt=""
            />
            <div className="container z-1000">
              <div className="row">
                <div className="col-12 mb-3 text-center">
                  <h2 className="wow fadeInUp mb-0" style={{ fontSize: '2.5em' }} data-wow-delay=".2s">
                    {currentServer?.name}
                  </h2>
                  <hr className="mt-2 mb-0" />
                </div>
              </div>
            </div>
          </section>

          <section className="no-top serverControl" style={{ padding: 0 }}>
            <div className="container">
              <div className="server_control_div">
                <span className="server_control_status">
                  <i style={{ backgroundColor: statusColors[resourceUsage?.state] }} /> {resourceUsage?.state?.replace('running', 'online')} <span className="server_resources_max" style={{ textTransform: 'lowercase' }}>(expires in {formatActiveTime(new Date(), new Date(new Date(currentServer?.created_at).getTime() + (currentServer?.expiry * (60 * 60) * 1000)))})</span>
                </span>
                <div>
                  <button onClick={() => sendJsonMessage({"event":"set state","args":["start"]})} disabled={(resourceUsage?.state == 'running')} style={(resourceUsage?.state == 'running') ? { cursor: 'no-drop', opacity: 0.5, background: 'var(--primary-color)' } : { background: 'var(--primary-color)' }}>
                    Start
                  </button>
                  <button onClick={() => sendJsonMessage({"event":"set state","args":["restart"]})} disabled={(resourceUsage?.state == 'running')}>
                    Restart
                  </button>
                  <button onClick={() => sendJsonMessage({"event":"set state","args":["stop"]})} disabled={!(resourceUsage?.state == 'running')} style={!(resourceUsage?.state == 'running') ? { cursor: 'no-drop', opacity: 0.5, background: 'var(--bs-danger)' } : { background: 'var(--bs-danger)' }}>
                    Stop
                  </button>
                  <button onClick={() => sendJsonMessage({"event":"set state","args":["kill"]})} disabled={!((resourceUsage?.state == 'running') || (resourceUsage?.state == 'starting'))} style={!((resourceUsage?.state == 'running') || (resourceUsage?.state == 'starting')) ? { cursor: 'no-drop', opacity: 0.5, background: 'var(--bs-warning)', color: 'black' } : { background: 'var(--bs-warning)', color: 'black' }}>
                    Kill
                  </button>
                </div>
              </div>
              <div className="server_details_mainbox">
                <form onSubmit={(e) => {e.preventDefault(); if (currentConsoleInput != '') { sendToConsole({ "event": "send command", args: [currentConsoleInput] }); setCurrentConsoleInput('') }}} className="server_console_form">
                  <div className="server_console_window" ref={xtermRef} />
                  <input placeholder="Type a command..." onChange={(e) => setCurrentConsoleInput(e.currentTarget.value)} value={currentConsoleInput} name="console" type="text"></input>
                </form>
                <div className="server_details_div">
                  {resourceValues.map(resource =>
                    <div className="server_resources_div" key={resource.name}>
                      <span className="server_resources_title">
                        {resource.name}
                      </span>
                      <span className="server_resources_value" style={(resource.fontSize == null) ? {} : { fontSize: `${resource.fontSize}px` }}>
                        <span>
                          {((resourceUsage?.state == 'running') || (resource.name == 'Address')) ?
                            <>
                              {resource.value} {(resource.max != null) && <span className="server_resources_max">/ {resource.max}</span>}
                            </>
                            :
                              "Offline"
                          }
                        </span>
                        {(resource.name == 'Disk') &&
                          <button title="Download" onClick={() => downloadFiles()}>
                            <FiDownload />
                          </button>
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <Footer />
      </div>
    </>
  );
}

// Devley
// Developed by Yuvaraja
