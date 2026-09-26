The project in the current working directory is a React + Vite + TypeScript app for Lumen,
a small analytics product. Its UI is written the way a lot of React apps use Bulma: Bulma's
own stylesheet, and Bulma's classes on plain JSX (`<div className="card">`,
`<button className="button is-primary">`). `@allxsmith/bestax-bulma` is already installed
alongside it, and dependencies are installed. Work in THIS project by editing its source.

Move the app onto @allxsmith/bestax-bulma. Wherever the library has a component for a piece
of this markup, use the component and its props instead of the classes: the navigation, the
hero, the feature cards, the pricing section, the team section, the contact form and what
happens when it's sent, the footer, and everything inside them.

The page has to look and behave the same when you're done. Keep every section, every piece
of copy and every link, including the ones that scroll to a section. Keep what the page
does: the navigation menu opens and closes on small screens, the pricing switches between
monthly and yearly prices, the hiring notice can be dismissed, and sending the contact form
shows a confirmation that can be closed again.

Keep the build and the typecheck passing. When you're done, list what you changed, and
anything you left as plain markup and why.
