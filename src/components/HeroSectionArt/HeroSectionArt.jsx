import "./HeroSectionArt.css";

/* A polished faux product screenshot built entirely from themed surfaces.
   Scoped under .page-landing so nothing leaks onto the tool's chrome. */
export const HeroSectionArt = () => {
  const bars = [42, 63, 51, 78, 88, 70, 96];

  return (
    <div className="hero-art">
      <div className="hero-window">
        {/* Window chrome */}
        <div className="hw-bar">
          <span className="hw-dot" />
          <span className="hw-dot" />
          <span className="hw-dot" />
          <div className="hw-address">app.example.com</div>
        </div>

        <div className="hw-body">
          {/* Mini sidebar */}
          <div className="hw-side">
            <div className="hw-side-brand" />
            <div className="hw-side-item is-active" />
            <div className="hw-side-item" />
            <div className="hw-side-item" />
            <div className="hw-side-item" />
          </div>

          {/* Main panel */}
          <div className="hw-main">
            <div className="hw-toolbar">
              <div className="hw-title-block">
                <div className="hw-title" />
                <div className="hw-subtitle" />
              </div>
              <div className="hw-pill">Label</div>
            </div>

            <div className="hw-stats">
              <div className="hw-stat">
                <div className="hw-stat-num">1,284</div>
                <div className="hw-stat-cap" />
              </div>
              <div className="hw-stat">
                <div className="hw-stat-num hw-accent">+18%</div>
                <div className="hw-stat-cap" />
              </div>
              <div className="hw-stat">
                <div className="hw-stat-num">64</div>
                <div className="hw-stat-cap" />
              </div>
            </div>

            <div className="hw-chart">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className={`hw-bar-col${i === bars.length - 1 ? " is-peak" : ""}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating "task done" chip for depth */}
      <div className="hero-chip">
        <span className="hero-chip-check" />
        <div className="hero-chip-lines">
          <span className="hero-chip-line" />
          <span className="hero-chip-line short" />
        </div>
      </div>
    </div>
  );
};
