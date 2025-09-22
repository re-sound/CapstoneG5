import { Camera, Tunnel, Reading, SensorKind, Fruit } from "../types";

const kinds: SensorKind[] = ["AMB_OUT", "AMB_RET", "PULP_1", "PULP_2", "PULP_3", "PULP_4"];
const fruits: Fruit[] = ["CEREZA", "UVA", "CLEMENTINA", "GENÉRICA"];

const rnd = (a:number,b:number)=> +(a + Math.random()*(b-a)).toFixed(1);

export function genTunnel(id:number): Tunnel {
  const fruit = fruits[(id-1) % fruits.length];
  const readings: Reading[] = kinds.map((k)=> {
    // AMB algo más alto y pulpas más frías
    const base = k.startsWith("AMB") ? rnd(7,12) : rnd(3.2, 10.5);
    // de vez en cuando OUT
    const v = Math.random()<0.06 ? "OUT" : base;
    return { kind: k, value: v };
  });
  return { id, fruit, readings, tick: 0 };
}

export function genData() {
  const tunnels: Tunnel[] = Array.from({length:7}, (_,i)=>genTunnel(i+1));
  const cameras: Camera[] = Array.from({length:8}, (_,i)=>({
    id: i+1,
    ambient: rnd(2.5, 7.5),
  }));
  return { tunnels, cameras };
}
