import React from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import CreateServer from "../components/createServer";

export default function ServerList() {
  const [currentServer, setCurrentServer] = React.useState(null);
  const [currentCategory, setCurrentCategory] = React.useState("*");
  const [fetchedDatas, setFetchedDatas] = React.useState(null);
  const [serverCreatingStatus, setServerCreatingStatus] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/list_server")
      .then((data) => data.json())
      .then((data) => setFetchedDatas(data))
      .catch((error) =>
        setFetchedDatas(Object({ categoriesList: [], serversList: [] }))
      );
  }, []);

  return (
    <>
      <div id="wrapper">
        <div
          style={{
            display:
              serverCreatingStatus || fetchedDatas == null ? "flex" : "none",
            zIndex: "99999999999",
          }}
          id="de-loader"
        ></div>

        <Header />

        <div className="no-bottom no-top" id="content">
          <div id="top"></div>

          <section id="subheader" className="jarallax pb20">
            <div className="de-gradient-edge-bottom"></div>
            <img
              src="/images/background/subheader-game.webp"
              className="jarallax-img"
              alt=""
            />
            <div className="container z-1000">
              <div className="row">
                <div className="col-lg-12 mb-3 text-center">
                  <div className="subtitle wow fadeInUp mb-3">Game Servers</div>
                  <h2 className="wow fadeInUp mb-0" data-wow-delay=".2s">
                    Available Trial Servers
                  </h2>
                  <hr className="mt20" />
                  <ul id="filters" className="wow fadeInUp" data-wow-delay="0s">
                    {fetchedDatas?.categoriesList?.map((category) => (
                      <li
                        onClick={() => setCurrentCategory(category.id)}
                        style={{ cursor: "pointer" }}
                        key={category._id}
                      >
                        <a
                          className={`${
                            category.id === currentCategory && "selected"
                          }`}
                        >
                          {category.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="no-top">
            <div className="container">
              <div id="gallery" className="row g-4">
                {fetchedDatas?.serversList
                  ?.filter((server) =>
                    server.category.includes(currentCategory)
                  )
                  .map((server) => (
                    <div
                      className={`col-lg-4 col-md-6 server-item item ${server.category.join(
                        " "
                      )}`}
                      key={server._id}
                    >
                      <div
                        className="de-item s2"
                        style={{
                          background: "var(--bg-dark-2)",
                          borderRadius: "16px",
                        }}
                      >
                        <div className="d-overlay">
                          {server.popular && (
                            <div className="d-label">Popular</div>
                          )}
                          <div className="d-text">
                            <h4>{server.name}</h4>
                            <p className="d-price">
                              Starting at{" "}
                              <span className="price">{server.price}</span>
                            </p>
                            <a
                              onClick={(e) => setCurrentServer(server)}
                              style={{ cursor: "pointer" }}
                              className="btn-main btn-fullwidth"
                            >
                              <span>Get Trial</span>
                            </a>
                          </div>
                        </div>
                        <img
                          src={server.art}
                          style={{ height: "100%", width: "100%" }}
                          className="img-fluid"
                          alt={server.name}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </section>
        </div>

        <CreateServer
          currentServerState={currentServer}
          setCurrentServerState={setCurrentServer}
          serverCreatingStatus={serverCreatingStatus}
          setServerCreatingStatus={setServerCreatingStatus}
        />

        <Footer />
      </div>
    </>
  );
}

// Devley
// Developed by Yuvaraja