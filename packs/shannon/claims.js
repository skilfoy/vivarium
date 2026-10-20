const packets = [
  { id: "c-100", owner: "ruth", title: "Roof, policy NM-100" },
  { id: "c-214", owner: "martin", title: "Wind, policy NM-214" },
  { id: "c-088", owner: "helen", title: "Loss run request" },
];

export function listPackets() {
  return packets.map((packet) => ({ id: packet.id, owner: packet.owner, title: packet.title }));
}
