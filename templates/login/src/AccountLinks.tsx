import { Link, Paragraph, Select } from '@allxsmith/bestax-bulma';

/** The links and the language picker under the box. */
function AccountLinks() {
  return (
    <>
      <Paragraph
        textSize="7"
        textAlign="centered"
        textColor="grey-dark"
        mt="4"
        mb="2"
      >
        <Link textColor="link" href="#">
          Sign up
        </Link>{' '}
        ·{' '}
        <Link textColor="link" href="#">
          Forgot password
        </Link>{' '}
        ·{' '}
        <Link textColor="link" href="#">
          Need help?
        </Link>
      </Paragraph>
      {/* The picker changes nothing yet, as in the original. */}
      <div className="has-text-centered">
        <Select
          id="language-select"
          name="language"
          label="Select language"
          labelProps={{ className: 'is-sr-only' }}
          size="small"
          isRounded
          mt="2"
          defaultValue="English"
        >
          <option>English</option>
          <option>French</option>
          <option>German</option>
          <option>Italian</option>
        </Select>
      </div>
    </>
  );
}

export default AccountLinks;
