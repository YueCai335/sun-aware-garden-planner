export function Toolbar() {
  return (
    <aside className="panel">
      <h1>Garden Planner</h1>
      <p>Start with a simple manual sun map before adding AI features.</p>

      <div className="field">
        <label htmlFor="location">Location</label>
        <input id="location" placeholder="Latitude, longitude" />
      </div>

      <div className="field">
        <label htmlFor="date">Date</label>
        <input id="date" type="date" />
      </div>

      <div className="field">
        <label htmlFor="tool">Drawing tool</label>
        <select id="tool">
          <option>Yard boundary</option>
          <option>House</option>
          <option>Tree</option>
          <option>Fence</option>
          <option>Planting bed</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="height">Obstacle height</label>
        <input id="height" inputMode="decimal" placeholder="Meters" />
      </div>

      <div className="button-row">
        <button className="primary-button" type="button">
          Simulate
        </button>
        <button className="secondary-button" type="button">
          Clear
        </button>
      </div>
    </aside>
  );
}
