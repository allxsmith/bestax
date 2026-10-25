import { Link, Paragraph, Select } from '@allxsmith/bestax-bulma';

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
      {/* As in the original, picking a language changes nothing yet. */}
      <div className="has-text-centered">
        <Select
          id="language-select"
          name="language"
          size="small"
          isRounded
          mt="2"
          label="Select language"
          labelProps={{ className: 'is-sr-only' }}
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
