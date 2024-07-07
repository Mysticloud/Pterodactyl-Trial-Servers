export default function Header() {
  return (
    <header className="transparent">
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="de-flex sm-pt10">
              <div className="de-flex-col">
                <div className="de-flex-col">
                  <div id="logo">
                    <a href="/">
                      <img className="logo-main" src="/images/logo.png" alt="" />
                      <img
                        className="logo-mobile"
                        src="/images/logo-mobile.png"
                        alt=""
                      />
                    </a>
                  </div>
                </div>
              </div>
              <div className="de-flex-col header-col-mid">
                <ul id="mainmenu">
                  <li>
                    <a className="menu-item bigHeader sm-none"></a>
                  </li>
                </ul>
              </div>
              <div className="de-flex-col">
                <div className="menu_side_area">
                  <a href="https://mysticlouds.com/" className="btn-main btn-line">
                    <span>Get Hosting</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
