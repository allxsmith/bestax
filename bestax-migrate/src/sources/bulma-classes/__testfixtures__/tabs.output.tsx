import { Icon, Tabs } from "@allxsmith/bestax-bulma";
export function Sections() {
  // TODO(bestax-migrate): bestax `Icon` renders `aria-label="icon"` when the element does not set it; add it here if that is what you want, then re-run
  return (
    <section>
      <Tabs align="centered" boxed>
        <ul>
          <li className="is-active">
            <a>Pictures</a>
          </li>
          <li>
            <a>Music</a>
          </li>
        </ul>
      </Tabs>
      <Tabs toggle rounded isFullwidth mt="2">
        <ul>
          <li>
            <a>
              <Icon size="small" aria-label="Pictures">
                <i className="fas fa-image" aria-hidden="true"></i>
              </Icon>
              <span>Pictures</span>
            </a>
          </li>
        </ul>
      </Tabs>
      <Icon textColor="info" aria-label="Info">
        <i className="fas fa-info-circle"></i>
      </Icon>
      <span className="icon">
        <i className="fas fa-home"></i>
      </span>
    </section>
  );
}
