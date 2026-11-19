import { Hero, Table, Title } from "@allxsmith/bestax-bulma";

export default function CommentsPage() {
  // TODO(bestax-migrate): an Internet Explorer conditional comment was dropped, since no browser React supports reads one: nothing to do unless the markup inside it matters (comments.html:10)
  // TODO(bestax-migrate): bestax `Table isResponsive` renders `.table-container` itself, so this element converts only around a single element that becomes a `Table`, with nothing else beside it (comments.html:13)
  return (
    <>
      {/* Hero, from the landing page */}
      <Hero color="light">
        {/* The body holds the copy */}
        <Hero.Body>
          <Title as="p">Comments{/* inline */} stay</Title>
          {/*
            Several lines,
            with *\/ inside
          */}
        </Hero.Body>
      </Hero>
      <div className="table-container">
        {/* A comment beside the table keeps the wrapper as markup */}
        <Table><tbody><tr><td>x</td></tr></tbody></Table>
      </div>
    </>
  );
}
