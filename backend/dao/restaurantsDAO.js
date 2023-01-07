import mongodb from "mongodb";
const ObjectId = mongodb.ObjectID;
let restaurants; //store refrence to database

export default class RestaurantsDAO {
  //intially connect to db, calls when server starts
  static async injectDB(conn) {
    if (restaurants) {
      return;
    }
    try {
      //gets the collection restaurants
      restaurants = await conn
        .db(process.env.RESTREVIEWS_NS)
        .collection("restaurants");
    } catch (e) {
      // if error
      console.error(
        `Unable to establish a collection handle in restaurantsDAO: ${e}`
      );
    }
  }

  static async getRestaurants({
    filters = null,
    page = 0,
    restaurantsPerPage = 20,
  } = {}) {
    let query;
    // mongodb querry
    if (filters) {
      if ("name" in filters) {
        // $text is not a db field. anywhere in the text, search name
        query = { $text: { $search: filters["name"] } };
      } else if ("cuisine" in filters) {
        // search by name, if cuisinr from database equals to the cuisine form filter
        query = { cuisine: { $eq: filters["cuisine"] } };
      } else if ("zipcode" in filters) {
        // search by name
        query = { "address.zipcode": { $eq: filters["zipcode"] } };
      }
    }

    let cursor;

    try {
      cursor = await restaurants.find(query); // find all resta that pass query
    } catch (e) {
      console.error(`Unable to issue find command, ${e}`);
      return { restaurantsList: [], totalNumRestaurants: 0 };
    }

    //cursor has every results but this line limits to 20 resta per page
    const displayCursor = cursor
      .limit(restaurantsPerPage)
      .skip(restaurantsPerPage * page);

    try {
      const restaurantsList = await displayCursor.toArray(); //turn to an array
      const totalNumRestaurants = await restaurants.countDocuments(query); //total restaurants

      return { restaurantsList, totalNumRestaurants };
    } catch (e) {
      console.error(
        `Unable to convert cursor to array or problem counting documents, ${e}`
      );
      return { restaurantsList: [], totalNumRestaurants: 0 };
    }
  }
}
