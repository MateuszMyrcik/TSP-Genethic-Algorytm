fs = require("fs");

const getCities = async () => {
  const data = await fs.readFileSync(
    "./dane/pr144.tsp",
    "utf8",
    function (err, data) {
      if (err) {
        return console.log(err);
      }

      return convertTSPToArray(data);
    }
  );

  return data;
};

const convertTSPToArray = (tspText) => {
  return tspText
    .split("NODE_COORD_SECTION")[1]
    .split("EOF")[0]
    .trim()
    .split("\n")
    .map((cordString) => cordString.trim().split(" "))
    .map((cordsArr) => cordsArr.filter((cord) => cord !== ""));
};

const init = async () => {
  const cities = await getCities().then((data) => {
    return convertTSPToArray(data);
  });

  console.log(cities);
};

init();
