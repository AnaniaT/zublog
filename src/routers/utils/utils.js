const checkObjectKeys = (object, allowedKeys) => {
  const includedKeys = Object.keys(object);
  const containsAllKeys = allowedKeys.every((key) =>
    includedKeys.includes(key)
  );
  const haveUnknownKey = includedKeys.every((key) => allowedKeys.includes(key));
  return containsAllKeys && haveUnknownKey;
};

module.exports = {
  checkObjectKeys,
};
