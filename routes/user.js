var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users").then((users) => {
      if (users.find((x) => x.user_id === req.session.user_id)) {
        req.user_id = req.session.user_id;
        next();
      }
    }).catch(err => next(err));
  } else {
    res.sendStatus(401);
  }
});


/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    console.log(user_id)
    console.log(recipe_id)
    await user_utils.markAsFavorite(user_id,recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
    } catch(error){
    next(error);
  }
})

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    let favorite_recipes = {};
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    let recipes_id_array = [];
    // console.log(recipes_id);
    recipes_id.map((element) => recipes_id_array.push(element.id)); //extracting the recipe ids into array
    let results = await recipe_utils.getRecipesPreview(recipes_id_array, user_id);
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});



router.get('/lastWatched', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    let last_recipes = {};
    const recipes_id = await user_utils.getLastWatchedRecipes(user_id);
    let recipes_id_array = [];
    // console.log(recipes_id);
    recipes_id.map((element) => recipes_id_array.push(element.id)); //extracting the recipe ids into array
    let results = await recipe_utils.getRecipesPreview(recipes_id_array, user_id);
    res.status(200).send(results);
  } catch(error){
    next(error);
  }
});

// /**
//  * This path gets body with recipeId and save this recipe in the watched list of the logged-in user
//  */
//  router.post('/watched', async (req,res,next) => {
//   try{
//     const user_id = req.session.user_id;
//     const recipe_id = req.body.recipeId;
//     await user_utils.markAsWatched(user_id,recipe_id);
//     res.status(200).send("The Recipe successfully saved as wacthed");
//     } catch(error){
//     next(error);
//   }
// })

//Ask if do different method fo getRecipesPreview
router.get('/familyRecipes', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const results = await recipe_utils.GetFromTable("FamilyRecipes",user_id);
    if (results.length == 0){
      throw { status: 201, message: "The user has no family recipes" };
    }
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});

/**
 * This path returns a full details of a family recipe by its id
 */
 router.get("/familyRecipe", async (req, res, next) => {
  try {
    let user_id;
    
    if (req.session && req.session.user_id){
      user_id = req.session.user_id;
      //await user_utils.markAsWatched(user_id,req.query.id);
    }
    const recipe = await user_utils.getFamilyRecipeDetails(req.query.id,user_id);
    // if(recipe==null){
    //   throw { status: 401, message: "recipe ID is not exists" }; 
    // }
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});



/**
 * This path returns a full details of a family recipe by its id
 */
 router.get("/myRecipe", async (req, res, next) => {
  try {
    let user_id;
    
    if (req.session && req.session.user_id){
      user_id = req.session.user_id;
      //await user_utils.markAsWatched(user_id,req.query.id);
    }
    const recipe = await user_utils.getPersonalRecipeDetails(req.query.id,user_id);
    // if(recipe==null){
    //   throw { status: 401, message: "recipe ID is not exists" }; 
    // }
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});

router.get('/myRecipes', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const results = await recipe_utils.GetFromTable("Recipes",user_id);
    if (results.length == 0){
      throw { status: 201, message: "User didn't upload any recipe" };
    }
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});




router.post("/recipe", async (req, res, next) => {
   
  try {

    // if(req.session.user_id==null){
    //   throw { status: 401, message: "You must log in in order to load a recipe to the website" };
    // }

    let recipe_details = {
      
      user_id: req.session.user_id,
      title: req.body.title,
      readyInMinutes: req.body.readyInMinutes,
      image: req.body.image,
      popularity:0, //by default  
      vegan: req.body.vegan,
      vegetarian: req.body.vegetarian,
      glutenFree: req.body.glutenFree,
      ingredients: req.body.ingredients,
      instructions: req.body.instructions,
      servings: req.body.servings
      
    }


    await DButils.execQuery(

      `INSERT INTO recipes (user_id,title,readyInMinutes,image,popularity,vegan,vegetarian, glutenFree,ingredients,instructions,servings ) VALUES (
        '${recipe_details.user_id}', '${recipe_details.title}', '${recipe_details.readyInMinutes}',
      '${recipe_details.image}', 0, '${recipe_details.vegan}', '${recipe_details.vegetarian}', '${recipe_details.glutenFree}', '${recipe_details.ingredients}', '${recipe_details.instructions}', '${recipe_details.servings}')`

    );

    res.status(201).send({ message: "recipe created", success: true });
  


  } catch (error) {
  next(error);
}

});


module.exports = router;
