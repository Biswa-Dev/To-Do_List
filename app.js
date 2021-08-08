//jshint esversion: 6

//declaring list array for work route
var workItems = [];
// var btnOfList;

//requiring express and body parser
const express = require("express");
const bodyParser = require("body-parser");
//requiring mongoosse module
const mongoose = require("mongoose");
//requiring lodash module
const _ = require("lodash");

//declaring out app
const app = express();
//setting view engine to ejs for our app to use ejs file 
app.set("view engine","ejs");
//using body parser
app.use(bodyParser.urlencoded({extended: true}));
//using express to get access to public folder, contains static files(css)
app.use(express.static("public"));

// Make Mongoose use `findOneAndUpdate()`. Note that this option is `true`
// by default, you need to set it to false.
mongoose.set('useFindAndModify', false);

//creating a new db for todolist 
mongoose.connect("mongodb+srv://biswa-dev:Test@123@cluster0.pisny.mongodb.net/todolistDB?retryWrites=true&w=majority", {
    useNewUrlParser: true, 
    useUnifiedTopology: true
});

//creating itemSchema
const itemSchema = {
    name: String
}

//creating model based on the schema
const Item = mongoose.model("Item",itemSchema);

//now create three documents using the model
const item1 = new Item({
    name: "Welcome to your toDoList"
});
const item2 = new Item({
    name: "Hit the + button to aff new item"
});
const item3 = new Item({
    name: "<-- Hit this to delete an item" 
});

//create a array of these documents
const defaultItems = [item1,item2,item3];

//creating a list schema for different list
const listSchema = {
    //for every list we are going to create the list will have a name
    name: String,
    //and a array of item document associated with it
    items: [itemSchema]
}

//creating a mongoose model
const List = mongoose.model("List",listSchema);

//get method for home route
app.get("/",function(req,res){
    Item.find({},function(err,foundItems){
        console.log(foundItems);
        //rendering the vaule of day to listTitle in ejs file and newListItems to items in ejs file
        //check if the foundItems array is empty, if empty then only insert
        if(foundItems.length === 0){
            //now use insertMany to insert all these document inside Item collection
            //of todolistDB db
            Item.insertMany(defaultItems,function(err){
                if(err){
                    console.log(err);
                }else{
                    console.log("Successfully saved default items to DB.");
                }
            });
            res.redirect("/");//this will redirect again to home but this time there are itmes
        }else{//we are not inserting, we are just rendering
            res.render("list", {
                listTitle:"Today",
                newListItems: foundItems
            });
        }
    });    
});

//routing using routing parameter for custom list
app.get("/:customListName",function(req,res){
    const customListName = _.capitalize(req.params.customListName);

    //checking wheter customListName already exists
    List.findOne({name: customListName},function(err,foundList){
        if(err){
            console.log(err);
        }else{
            if(!foundList){
                //if itme doesn't exist
                //create a list for customListName
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/"+customListName);
            }else{
                //if item exist
                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items
                }); 
            }
        }
    });

    //res.send("uploaded");
});


//post method for home route while user enters a new list item
app.post("/",function(req,res){
    //after clicking on + button getting the new item and list tytle from submit button
    const itemName = req.body.newItem;
    const listName = req.body.btnOfList;
    console.log("itemName:"+itemName+" listName:"+listName);
    //creating a new item document
    const item = new Item({
        name: itemName
    });

    //now check if the listName is equal to Today
    if(listName === "Today"){
        //saving it to db
        item.save();

        //again redirecting to our home route to load all the items
        res.redirect("/");   
    }else{//new list 
        //find that list which has been created using the get request(dynamic routing)
        List.findOne({name: listName},function(err,foundList){
            //push the new item to that list's list item array
            console.log(foundList);
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName);
        });
    }
});

//post method for deleting item using checkbox (form)
app.post("/delete",function(req,res){
    //console.log(req.body);
    //initialize the checked item(id)
    const checkedItem = req.body.checkbox;
    //initialize the list name
    const listName = req.body.listName;

    //now check, we have to delete item of which list
    //if the list is today list
    if(listName === "Today")
    {
        //find the item by id and remove it then redirect to home page
        Item.findByIdAndRemove(checkedItem,function(err){
            if(err){
                console.log(err);
            }else{
                console.log("Succesfully removed selected item.");
                res.redirect("/");
            }
        });
    }else{//else tap into to the List model and use findOneAndUpdate({condition},{update}, callback)
        List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItem}}},function(err, foundList){
            if(!err){
                console.log(foundList);
                res.redirect("/"+listName);
            }
        });
    }
    
});

// app.get("/work",function(req,res){
//     res.render("list", {
//         listTitle:"Work",
//         newListItems: workItems
//     });
// });

app.get("/about",function(req,res){
    res.render("about");
})

//setting our app to listen port 3000
app.listen(3000, function(){
    console.log("Server is running on port 3000.");
});



//mongo "mongodb+srv://cluster0.pisny.mongodb.net/myFirstDatabase" --username biswa-dev