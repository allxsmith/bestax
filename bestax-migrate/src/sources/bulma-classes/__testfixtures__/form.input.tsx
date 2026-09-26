export function SignUp() {
  return (
    <form>
      <div className="field">
        <label className="label">Name</label>
        <div className="control">
          <input className="input" type="text" placeholder="Text input" />
        </div>
      </div>
      <div className="field">
        <label className="label">Username</label>
        <div className="control has-icons-left">
          <input
            className="input is-success"
            type="text"
            placeholder="Text input"
            defaultValue="bulma"
          />
          <span className="icon is-small is-left">
            <i className="fas fa-user"></i>
          </span>
        </div>
        <p className="help is-success">This username is available</p>
      </div>
      <div className="field">
        <label className="label">Subject</label>
        <div className="control">
          <div className="select">
            <select>
              <option>Select dropdown</option>
            </select>
          </div>
        </div>
      </div>
      <div className="field">
        <label className="label">Message</label>
        <div className="control">
          <textarea className="textarea is-small" placeholder="Textarea"></textarea>
        </div>
      </div>
      <div className="field">
        <div className="control">
          <label className="checkbox">
            <input type="checkbox" /> I agree
          </label>
        </div>
      </div>
      <div className="field is-horizontal">
        <div className="field-label is-normal">
          <label className="label">From</label>
        </div>
        <div className="field-body">
          <div className="field">
            <p className="control is-expanded">
              <input className="input" type="text" placeholder="Name" />
            </p>
          </div>
        </div>
      </div>
      <div className="field is-grouped">
        <div className="control">
          <button className="button is-link">Submit</button>
        </div>
        <div className="control">
          <button className="button is-link is-light">Cancel</button>
        </div>
      </div>
    </form>
  );
}
