import { prisma } from "../lib/prisma";

async function fixProductDescriptions() {
  const updates = [
    {
      id: "cmslna54u001gwabkt4butwyj",
      description: "Premium customized luxury gift cards with gold foil accents and envelopes. Perfect for birthdays, anniversaries, weddings, and corporate recognition.",
    },
    {
      id: "cmslna6ya009gwabkxn3m8j6m",
      description: "Armaf Club De Nuit Intense Man is an iconic woody spicy fragrance featuring fresh lemon, blackcurrant, and apple top notes paired with birch, jasmine, and deep ambergris.",
    },
    {
      id: "cmslna88w00hswabkaut6pbrq",
      description: "Velvet-lined luxury presentation ring holder stand designed for jewelry storage, gift presentation, and bedside organizer elegance.",
    },
    {
      id: "cmslna89400huwabk8rnwbdqj",
      description: "Complete luxury presentation gift ensemble including a velvet-lined ring holder stand, premium customized gift card, and boutique gift bag.",
    },
  ];

  for (const item of updates) {
    const updated = await prisma.product.update({
      where: { id: item.id },
      data: { description: item.description },
    });
    console.log(`Updated ${updated.name} (ID: ${updated.id}) -> description length: ${updated.description.length}`);
  }
}

fixProductDescriptions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
