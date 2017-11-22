"use strict"

module.exports = function(record, primaryKey)
{
  let update = {};
  for (let key in record)
  {
    let value = record[key];
    if (value !== undefined)
    {
      if (key === primaryKey)
      {
        update[key] = {
          "S": value
        };
      }
      else
      {
        update[key] = {
          "S": JSON.stringify(value)
        };
      }
    }
  }
  return update;
};
