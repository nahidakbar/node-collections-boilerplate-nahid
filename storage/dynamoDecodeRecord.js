"use strict"

module.exports = function (record, primaryKey)
{
  let decoded = {};
  for (let key in record)
  {
    let value = record[key].S;
    if (key === primaryKey)
    {
      decoded[key] = value;
    }
    else
    {
      decoded[key] = JSON.parse(value);
    }
  }
  return decoded;
};
