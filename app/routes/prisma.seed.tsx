import { Form } from "@remix-run/react";
import { Button } from "~/components/ui/button";

export async function action({ request }: LoaderFunctionArgs) {

  const formData = await request.formData();
  const { _action, ...values } = Object.fromEntries(formData);

  console.log({ action: _action, values })


  return null

}

export default function PrismaSeed() {


  return (

    <Form method="post">
      <Button name="_action" value="prisma-seed">
        Prisma PrismaSeed
      </Button>
    </Form>
  )
}