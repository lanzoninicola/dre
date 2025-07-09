export function parseOFX(ofxText: string) {
  // Simula parsing de OFX
  return [
    {
      date: new Date(),
      description: "Venda via PIX",
      amount: 120.5,
      accountId: "demo-account-id"
    },
    {
      date: new Date(),
      description: "Taxa iFood",
      amount: -18.7,
      accountId: "demo-account-id"
    }
  ];
}
