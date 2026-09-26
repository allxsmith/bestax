import clsx from 'clsx';
import classNames from 'classnames';

export function Toolbar() {
  const busy = true;
  const quiet = false;
  return (
    <div className={classNames('buttons', { 'has-addons': quiet })}>
      <button className={clsx('button is-primary', busy && 'is-loading')}>
        Save
      </button>
      <button className={clsx('button', quiet ? '' : 'is-outlined', 'my-btn')}>
        Cancel
      </button>
      <div
        className={clsx('notification', busy ? 'is-light' : null, quiet && 'my-quiet')}
      >
        Saving
      </div>
      <div className={clsx('box', busy ? 'mt-2' : 'mt-4')}>Either margin</div>
    </div>
  );
}
