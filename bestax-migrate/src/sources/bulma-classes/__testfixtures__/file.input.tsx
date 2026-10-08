export function Uploads({ onPick }: { onPick: () => void }) {
  return (
    <form>
      <div className="field">
        <div className="file">
          <label className="file-label">
            <input className="file-input" type="file" name="resume" />
            <span className="file-cta">
              <span className="file-icon">
                <i className="fas fa-upload"></i>
              </span>
              <span className="file-label">Choose a file…</span>
            </span>
          </label>
        </div>
      </div>
      <div className="field">
        <div className="file is-primary is-boxed has-name mt-2">
          <label className="file-label">
            <input
              className="file-input"
              type="file"
              name="photo"
              accept="image/*"
              onChange={onPick}
            />
            <span className="file-cta">
              <span className="file-label">Upload a photo</span>
              <span className="file-icon">
                <span className="icon" aria-hidden="true">
                  <i className="fas fa-cloud-upload-alt"></i>
                </span>
              </span>
            </span>
            <span className="file-name">portrait.png</span>
          </label>
        </div>
      </div>
      {/* No field around it, so File would render one of its own. */}
      <div className="file">
        <label className="file-label">
          <input className="file-input" type="file" name="cv" />
          <span className="file-cta">
            <span className="file-label">Upload</span>
          </span>
        </label>
      </div>
      {/* Something in the tree File doesn't render. */}
      <div className="field">
        <div className="file">
          <label className="file-label">
            <input className="file-input" type="file" name="doc" />
            <span className="file-cta">
              <span className="file-label">Upload</span>
              <small>PDF only</small>
            </span>
          </label>
        </div>
      </div>
      {/* An attribute File would put on its input. */}
      <div className="field">
        <div className="file" id="upload">
          <label className="file-label">
            <input className="file-input" type="file" name="scan" />
            <span className="file-cta">
              <span className="file-label">Upload</span>
            </span>
          </label>
        </div>
      </div>
    </form>
  );
}
