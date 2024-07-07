import React from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { bytesCalc, megabytesCalc } from "../utils/parse";

export default function CreateServer({
  currentServerState,
  setCurrentServerState,
  serverCreatingStatus,
  setServerCreatingStatus,
}) {
  const createServerRef = React.useRef(null);
  const [errorMsg, setErrorMsg] = React.useState("");

  React.useEffect(() => {
    window.onclick = (event) => {
      if (serverCreatingStatus) return;
      if (createServerRef.current !== null) {
        if (event.target == createServerRef.current) {
          setCurrentServerState(null);
        }
      }
    };
  }, []);

  async function createServerRequest(event) {
    event.preventDefault();
    setServerCreatingStatus(true);
    setErrorMsg("");
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData);
    try {
      const response = await fetch("/api/create_server", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (response.status == 201) {
        var previousServers = Object({})
        try {
          previousServers = JSON.parse(localStorage.getItem('trialServers') || "{}")
        } catch {}
        previousServers[result.uuid] = result.hash
        localStorage.setItem('trialServers', JSON.stringify(previousServers))
        return document.location.assign(`/server/${result.uuid}`);
      } else if (response.status >= 500) {
        setErrorMsg(result?.error || "Failed to Create Server, Internal Error");
      } else {
        setErrorMsg(result?.error || "Failed to Validate Captcha");
      }
  } catch (error) {
      setErrorMsg("Error Occured while Creating the Server");
      console.error("Error:", error);
    }
    setServerCreatingStatus(false);
  }

  return (
    <div
      ref={createServerRef}
      style={{ display: currentServerState == null ? "none" : "flex" }}
      className="createServer_dialog"
    >
      <div className="createServer_dialog_inner">
        <div className="createServer_server_details">
          <img
            src={currentServerState?.art}
            className="createServer_image"
          ></img>
          <div className="createServer_details_div">
            <h2
              style={{ fontSize: "2.5em", marginBottom: 0, paddingBottom: 0 }}
            >
              {currentServerState?.name}
            </h2>
            <span style={{ lineHeight: 1.7 }}>
              {currentServerState?.description}
            </span>
            {(currentServerState?.links != null) &&
              <div className="createServer_details_link">
                {Object.keys(currentServerState?.links)?.map(link =>
                  <a target="_blank" key={link} href={currentServerState?.links[link]}>{link}</a>
                )}
              </div>
            }
            <div className="serverCreate_resources_div">
              <div className="btn-main">
                <span>{currentServerState?.server_data?.limits?.cpu} %</span>
                <span>CPU</span>
              </div>
              <div className="btn-main">
                <span>
                  {megabytesCalc(currentServerState?.server_data?.limits?.memory)}
                </span>
                <span>RAM</span>
              </div>
              <div className="btn-main">
                <span>
                  {megabytesCalc(currentServerState?.server_data?.limits?.disk)}
                </span>
                <span>DISK</span>
              </div>
            </div>
          </div>
        </div>
        <form
          action="/api/server"
          method="POST"
          encType="application/json"
          onSubmit={createServerRequest}
        >
          {import.meta.env.VITE_CAPTCHA_SITE_KEY != null &&
            import.meta.env.VITE_CAPTCHA_SITE_KEY != "" && (
              <ReCAPTCHA 
                theme="dark"
                sitekey={import.meta.env.VITE_CAPTCHA_SITE_KEY || ''}
              />
            )}
          <input
            name="trialServerId"
            value={currentServerState?._id || ""}
            style={{ display: "none" }}
          ></input>
          <button className="btn-main" type="submit">
            Create trial Server
          </button>
          {errorMsg != "" && (
            <span
              style={{
                color: "var(--bs-red)",
                lineHeight: "1",
                fontSize: "15px",
                marginTop: '5px',
                marginInline: "4px",
              }}
            >
              {errorMsg}
            </span>
          )}
          <span style={{ lineHeight: '1', marginInline: "4px", fontSize: "15px" }}>
            By clicking create you agree to minecraft <span style={{ color: 'var(--secondary-color)' }}>eula</span>.
          </span>
        </form>
      </div>
    </div>
  );
}

// Devley
// Developed by Yuvaraja