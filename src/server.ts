import { createServer, Server } from "http";
import { config } from "dotenv";
import axios from "axios";

config();

type ATISOrigin = {
  airport: string;
  type: string;
  code: string;
  datis: string;
};

type ATISReturn = {
  facility: string;
  preset: string;
  atisLetter: string;
  atisType: string;
  airportConditions: string;
  notams: string;
  timestamp: string;
  version: "4.0.0";
};

export const fetchData = async () => {
  const url = `https://datis.clowd.io/api/${process.env.icao}`;
  const response = await axios.get(url);
  return response.data as ATISOrigin[];
};

const type = (t: string) => {
  if (t === "dep") {
    return "departure";
  } else if (t === "arr") {
    return "arrival";
  } else {
    return t;
  }
};

const getOps = (str: string) => {
  const startIndex = str.indexOf(".", str.indexOf(".") + 1) + 2;
  const endIndex = str.indexOf(".", startIndex);
  return str.substring(startIndex, endIndex);
};

const getNOTAMS = (str: string) => {
  const startIndex = str.indexOf("NOTAMS") + "NOTAMS".length + 4;
  const endIndex = str.indexOf("...ADVS YOU HAVE INFO I.");
  return str.substring(startIndex, endIndex);
};

function customDateTimeFormat(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${month}-${day}-${year} ${hours}:${minutes}:${seconds}`;
}

const parseATIS = (data: ATISOrigin[]): ATISReturn => {
  const atis = data[0].datis;

  console.log(data);

  const ops = getOps(atis);
  const notams = getNOTAMS(atis);

  return {
    facility: data[0].airport,
    preset: "RW",
    atisLetter: data[0].code,
    atisType: type(data[0].type),
    airportConditions: ops,
    notams: notams,
    timestamp: customDateTimeFormat(new Date()),
    version: "4.0.0",
  };
};

export function startServer(port: number): Server {
  const server = createServer((req, res) => {
    if (req.url === "/favicon.ico") {
      res.writeHead(404);
      res.end();
      return;
    }

    fetchData().then((data) => {
      res.writeHead(200, {
        "Content-Type": "application/json",
      });
      res.write(JSON.stringify(parseATIS(data)));
      res.end();
    });
  });

  server.listen(port, () => {
    console.log(
      `Server is listening on port ${port}, http://localhost:${port}/`
    );
  });

  return server;
}
