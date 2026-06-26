export type ClerkEmailAddress = {
  id: string;
  email_address: string;
};

export type ClerkUserPayload = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  image_url: string;
  primary_email_address_id: string | null;
  email_addresses: ClerkEmailAddress[];
};
