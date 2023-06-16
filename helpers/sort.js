export const sortBySearchScore = () => {
  return {
    $sort: {
      score: { $meta: "textScore" },
    },
  };
};
