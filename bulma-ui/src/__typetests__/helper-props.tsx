import type { BulmaClassesProps } from '../helpers/useBulmaClasses';
import type { ButtonOwnProps } from '../elements/Button';
import type { LinkButtonOwnProps } from '../elements/LinkButton';
import type { LinkOwnProps } from '../elements/Link';
import type { AvatarOwnProps } from '../components/Avatar';
import type { RevealOwnProps } from '../components/Reveal';
import type {
  NavbarItemOwnProps,
  NavbarLinkOwnProps,
} from '../components/Navbar';
import type { MenuItemOwnProps } from '../components/Menu';

/**
 * Every Bulma helper key must be DECLARED on a polymorphic component's own
 * props, never merely `Omit`ted from `BulmaClassesProps`.
 *
 * Omitting a key takes it out of `keyof Own`, which is what subtracts the
 * element's side — so the key comes back from whatever `as` renders, while
 * `useBulmaClasses` still consumes it before `rest` is spread. A custom target
 * declaring one then type-checks and never receives it.
 *
 * This caught `color` on three components and `backgroundColor` on five, in
 * two separate review rounds. The check exists so the next helper prop, or the
 * next polymorphic component, cannot reopen the class quietly: a failure names
 * the component and the missing key.
 */
type Missing<Own> = Exclude<keyof BulmaClassesProps, keyof Own>;
type None<T> = [T] extends [never] ? true : { MISSING: T };

export const button: None<Missing<ButtonOwnProps>> = true;
export const linkButton: None<Missing<LinkButtonOwnProps>> = true;
export const link: None<Missing<LinkOwnProps>> = true;
export const avatar: None<Missing<AvatarOwnProps>> = true;
export const reveal: None<Missing<RevealOwnProps>> = true;
export const navbarItem: None<Missing<NavbarItemOwnProps>> = true;
export const navbarLink: None<Missing<NavbarLinkOwnProps>> = true;
export const menuItem: None<Missing<MenuItemOwnProps>> = true;
