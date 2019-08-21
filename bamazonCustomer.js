// Requirements

let inquirer = require("inquirer");
let mysql = require("mysql");
let CliTable = require("cli-table");
let table
let total = 0;
let currentItem;

makeTable = () => {
  table = new CliTable({
    head: ["item_id", "product_name", "department_name", "price", "stock_quantity"],
    colWidths: [20, 20, 20, 20, 20]
  })
}


// MySQL Join

let con = mysql.createConnection({
  host: "localhost",
  user: "root",
  port: "3306",
  password: "",
  database: "Bamazon"
});

con.connect(function (err) {
  if (err) throw err;
  console.log("connected as id " + con.threadId + "\n");
});

con.query("SELECT * FROM products", function (err, result) {
  if (err) throw err;
  console.log(result);
  makeTable()
  result.forEach(item => {
    table.push([item.item_id, item.product_name, item.department_name, item.price, item.stock_quantity])
  })
  console.log(table.toString());
  initialize();
})


let initialize = () => {
  inquirer
    .prompt([
      /* Pass your questions in here */
      {
        type: "list",
        name: "choice",
        message: "welcome to Bamazon please select a department.",
        choices: ["electronics", "clothing"]
      }
    ]).then(answer => {
      let temp = []
      con.query(`SELECT * FROM products WHERE department_name = ?`, answer.choice, function (err, result) {
        makeTable()
        result.map(item => {
          table.push([item.item_id, item.product_name, item.department_name, item.price, item.stock_quantity])
          temp.push(item.product_name)
        })
        console.log(table.toString())
        inquirer
          .prompt([
            /* Pass your questions in here */
            {
              type: "list",
              name: "choice",
              message: "Select the item you would like to purchase.",
              choices: temp
            }, {
              type: "input",
              name: "quantity",
              message: "pleae enter the amount.",
            }
          ]).then(reply => {
            con.query(`SELECT * FROM products WHERE product_name = "${reply.choice}"`, function (err, res) {
              currentItem = res[0]
              if (currentItem.stock_quantity == 0) {
                console.log("Sorry this item is out of stock.")
                initialize()
              } else {
                if (reply.quantity > currentItem.stock_quantity) {
                  console.log("We're sorry we don't have enough in stock, putting everything in cart...")
                  reply.quantity = currentItem.stock_quantity
                }
                con.query(`UPDATE products SET stock_quantity = "${currentItem.stock_quantity - reply.quantity}" WHERE product_name = "${reply.choice}"`, function (er, response) {
                  total += parseInt(currentItem.price * reply.quantity)
                  console.log("Putting your selection into your cart...")
                  inquirer
                    .prompt({
                      type: "list",
                      name: "select",
                      message: "What would you like to do?.",
                      choices: ["continue shopping", "checkout"]
                    }).then(e => {
                      if (e.select === "checkout") {
                        console.log("Your grand total is " + total + " dollars!")
                        process.exit()
                      } else {
                        initialize()
                      }
                    })
                })
              }
            })

          })
      })
    }).catch(e => console.log(e))
}

