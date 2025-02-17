let express = require('express');
let route = express.Router();
var exe = require("./connection.js")

function checkAdmin(req, res, next) {

    if (req.session.uid) {
        next();
    } else {
        res.redirect("/login");
    }
}
let expireMed = async() => {
    let med = await exe(`select*from stocks`);
    for (let i of med) {


        let e = new Date(i.exp).getTime();
        let n = new Date().getTime();
        let es = e / 1000;
        let em = es / 60;
        let eh = em / 60;
        let ed = eh / 24;

        let ns = n / 1000;
        let nm = ns / 60;
        let nh = nm / 60;
        let nd = nh / 24;
        if (Math.floor(ed - nd) <= 0) {
            let update = await exe(`update stocks set isExpired='${1}' where id='${i.id}'`);
        }
    }


}
route.get("/login", (req, res) => {
    let obj = {
        "warn": ''
    }
    res.render("admin/l.ejs", obj);
})

route.post("/user-login", async(req, res) => {
    let d = await exe(`select*from userlogin where username='${req.body.username}' and password='${req.body.password}' `);

    req.session.uid = 1;
    if (d.length == 0) {
        let obj = {
            "warn": 'Wrong username or password'
        }
        res.render('admin/l.ejs', obj)
    } else {
        req.session.uid = d[0].id;
        res.redirect("/");
    }
})


route.get("/", checkAdmin, async(req, res) => {
    expireMed();
    var img = await exe(`select * from userlogin `)
    var ttl = await exe(`select count(*) as ttlcount from customer`)
    var ttp = await exe(`select count(*) as ttlparty from vendor`)
    let tsell = await exe(`select *,(select net_ttl from bill_det where bill_det.bill_id=bill.id) as exp from bill`);
    let texp = await exe(`select* from product_bill`);
    let tprof = await exe(`select*from bill where pdate='${new Date().toISOString().slice(0,10)}'`);
    let ttl_sell = 0;
    let ttl_exp = 0;
    let ttl_pr = 0;
    for (let i of tprof) {
        let orders = await exe(`select*,(select rate from stocks where stocks.id=order_list.product) as rate from order_list where bill_id='${i.id}'`)
        console.log(orders);
        for (let j of orders) {
            let pr = j.mrp - j.rate;

            ttl_pr = Number(ttl_pr) + Number(pr);
        }

    }

    for (let i of tsell) {
        if (i.pdate == new Date().toISOString().slice(0, 10)) {
            ttl_sell = Number(ttl_sell) + Number(i.exp);
        }
    }
    for (let i of texp) {
        if (i.idate == new Date().toISOString().slice(0, 10)) {
            ttl_exp = Number(ttl_exp) + Number(i.net_ttl);
        }
    }

    var ttl_med = `select count(*) as ttl_m from stocks where qty > 0 `
    var data3 = await exe(ttl_med)

    var ttl_bill = `select count(*) as ttl_b from bill `
    var data4 = await exe(ttl_bill)

    var data5 = await exe(`select count(*) as ttlo from stocks where qty=0`)
    var data6 = await exe(`select count(*) as ttle from stocks where isExpired=1`)


    var obj = { "img": img[0], "ttl": ttl[0], "ttp": ttp[0], "ttl_sell": ttl_sell, "ttl_exp": ttl_exp, "ttl_pr": ttl_pr, "ttl_med": data3[0], "ttl_bill": data4[0], "ttl_out": data5[0], "ttlexp": data6[0] };

    res.render('admin/index.ejs', obj);
    // res.send(data3)
})


route.get("/profile", checkAdmin, async(req, res) => {
    let d = await exe('select * from userlogin');
    var img = await exe(`select * from userlogin `)

    let obj = {
        "data": d[0],
        "img": img[0]
    }
    res.render("admin/addaccount.ejs", obj);
})

route.post("/update-user", async(req, res) => {

    if (req.files != null) {
        req.body.image = new Date().getTime() + req.files.img.name;
        req.files.img.mv("public/userimage/" + req.body.image);

        let d = await exe(`update userlogin set image='${req.body.image}' where id='1' `);

    }

    let d = await exe(`update userlogin set username='${req.body.username}',password='${req.body.password}' where id='1' `);
    res.redirect("/profile");





})


route.get("/logout", (req, res) => {
    req.session.uid = undefined;
    res.redirect("/login");
})

route.get("/add-party", checkAdmin, async(req, res) => {
    var img = await exe(`select * from userlogin `)

    var obj = { "img": img[0] }
    res.render("admin/addparty.ejs", obj);
})
route.post("/save-party", async(req, res) => {


    let d = await exe(`insert into vendor(name,email,contact,ttl_purchases,website,contract_start,contract_end,contract_status) values('${req.body.name}','${req.body.email}','${req.body.contact}','${0}',
        '${req.body.website}','${new Date().toISOString().slice(0,10)}','${"null"}','${"active"}')`);
    res.redirect("/parties");
})
route.get("/parties", checkAdmin, async(req, res) => {
    var img = await exe(`select * from userlogin `)
    let d = await exe('select*from vendor');
    let obj = {
        "data": d,
        "img": img[0]
    }
    res.render("admin/vendorlist.ejs", obj);
})
route.get("/show-party/:id", checkAdmin, async(req, res) => {
    let d = await exe(`select*from vendor where id='${req.params.id}'`);
    var img = await exe(`select * from userlogin `)
    let obj = {
        "data": d[0],
        "img": img[0]
    }
    res.render("admin/viewparty.ejs", obj);
})
route.post("/update-party/:id", async(req, res) => {

    if (req.body.contract_status == 'expire') {
        let d = await exe(`update vendor set name='${req.body.name}',email='${req.body.email}',contact='${req.body.contact}',website='${req.body.website}',contract_status='${req.body.contract_status}',contract_end='${new Date().toISOString().slice(0,10)}' where id='${req.params.id}'`);
    } else {
        let d = await exe(`update vendor set name='${req.body.name}',email='${req.body.email}',contact='${req.body.contact}',website='${req.body.website}' where id='${req.params.id}'`);

    }
    res.redirect("/show-party/" + req.params.id);
})


route.get("/delete-party/:id", checkAdmin, async(req, res) => {
    let d = await exe(`delete from vendor where id='${req.params.id}'`);
    res.redirect("/parties");
})



route.get("/addcustomer", checkAdmin, async function(req, res) {
    var img = await exe(`select * from userlogin `)

    var obj = { "img": img[0] }
    res.render("admin/addcustomer.ejs", obj)
})


route.post("/save-customer", async function(req, res) {
    var d = req.body
    d.cname = d.cname.replaceAll("'", "\\'");
    var sql = `insert into customer(cname,cemail,ccontact,cadd)values('${d.cname}','${d.cemail}','${d.ccontact}','${d.cadd}')`

    var data = await exe(sql);

    res.redirect("/allcustomer")
})

route.get("/allcustomer", checkAdmin, async function(req, res) {
    var img = await exe(`select * from userlogin `)
    var clist = await exe(`select * from customer`)

    var obj = { "img": img[0], "clist": clist }
    res.render("admin/customer_list.ejs", obj)
})


route.get("/delete-customer/:id", async function(req, res) {
    // var sql = `delete from customer where cid = '${req.params.id}'`
    var data = await exe(`delete from customer where cid='${req.params.id}'`)

    res.redirect("/allcustomer")

})

route.get("/show-customer/:id", checkAdmin, async function(req, res) {

    var data = await exe(`select * from customer where cid ='${req.params.id}'`)

    var img = await exe(`select * from userlogin`)

    var obj = { "img": img[0], "data": data[0] }

    res.render("admin/viewcustomer.ejs", obj)


})

route.post("/update-customer/:id", async function(req, res) {
    var d = req.body
    var data = await exe(`update customer set cname = '${d.cname}',cemail = '${d.cemail}',ccontact = '${d.ccontact}',cadd = '${d.cadd}' where cid ='${req.params.id}'`)
    res.redirect("/allcustomer")
})
route.get("/addpurchase", checkAdmin, async(req, res) => {
    var img = await exe(`select * from userlogin`)
    let ven = await exe(`select*from vendor where contract_status='active'`);
    var obj = { "img": img[0], "v": ven }
    res.render("admin/purchase.ejs", obj);
})
route.post("/save-purchase", async(req, res) => {

    let x = req.body;

    let par = await exe(`select*from vendor where id='${x.vid}'`);
    let pcount = await exe(`update vendor set ttl_purchases=${par[0].ttl_purchases+1} where id='${x.vid}'`);
    let pbill = await exe(`insert into product_bill(vendor,idate,total,gst,discount,net_ttl) values('${x.vid}','${x.date}','${x.ttl}','${x.gst}','${x.disc}','${x.net_ttl}')`);


    //let pbill=await exe(`insert into product_bill(vendor,idate,total,gst,net_ttl) values('${x.vid}','${new Date(x.date).toISOString().slice(0,10)}','${x.ttl}','${x.gst}','${x.net_ttl}')`);


    for (let i = 0; i < x.pname.length; i++) {

        let d = await exe(`insert into product(pname,packing,batchid,exp,qty,mrp,rate,amt,adddate,isexpired,party,p_billid) values('${x.pname[i]}','${x.packing[i]}','${x.bid[i]}','${x.exp[i]}','${x.qty[i]}','${x.mrp[i]}','${x.rate[i]}','${x.amt[i]}','${new Date(x.date).toISOString().slice(0,10)}','${false}','${req.body.vid}','${pbill.insertId}')`);
        await exe(`insert into stocks(pname,packing,batchid,exp,qty,mrp,rate,amt,adddate,isExpired,party) values('${x.pname[i]}','${x.packing[i]}','${x.bid[i]}','${x.exp[i]}','${x.qty[i]}','${x.mrp[i]}','${x.rate[i]}','${x.amt[i]}','${new Date().toISOString().slice(0,10)}','${false}','${req.body.vid}')`);

    }
    res.send(pbill.insertId + "");


})
route.get("/purchase-inv/:id", checkAdmin, async(req, res) => {
    var data = await exe(`select * from mdetails where m_id = '1' `)
    let bill_d = await exe(`select*,(select name from vendor where vendor.id=product_bill.vendor) as vname from product_bill where id='${req.params.id}'`)
    let prod = await exe(`select*from product where p_billid='${req.params.id}'`);
    let obj = {
        "b_data": bill_d[0],
        "prod": prod,
        "data": data[0]
    }
    res.render("admin/productbillinv.ejs", obj);
})
route.get("/stocks", checkAdmin, async(req, res) => {
    var img = await exe(`select * from userlogin`);
    let stocks = await exe(`select*,(select name from vendor where vendor.id=stocks.party) as party_name from stocks`);
    var obj = { "img": img[0], "p": stocks };
    res.render("admin/stockslist.ejs", obj);
})
route.get("/all-purchases", checkAdmin, async(req, res) => {
    var img = await exe(`select * from userlogin`)
    let p = await exe(`select*,(select name from vendor where vendor.id=product.party) as party_name from product `);
    var ttl = await exe(`select * from product_bill`)

    var obj = { "img": img[0], "p": p, "ttl": ttl };
    res.render("admin/purchaselist.ejs", obj);
})
route.get("/delete-product/:id", checkAdmin, async(req, res) => {
    let d = await exe(`delete from product where id='${req.params.id}'`)
    res.redirect("/all-purchases");
})

route.get("/sale-product", checkAdmin, async(req, res) => {
    var img = await exe(`select * from userlogin`)
    let cust = await exe('select*from customer');
    let med = await exe(`select*from stocks where isExpired=${0} and qty!=0`)
    var obj = { "img": img[0], 'c': cust, "med": med };
    res.render('admin/saleproduct.ejs', obj);
})
route.post("/save-bill", async(req, res) => {
    let d = req.body;
    let b = await exe(`insert into bill(pdate,cid) values('${new Date().toISOString().slice(0,10)}','${d.cid}')`);


    for (let i = 0; i < d.product.length; i++) {
        let s = await exe(`insert into order_list(product,bid,mrp,qty,total,bill_id,up) values('${d.product[i]}','${d.bid[i]}','${d.mrp[i]}','${d.qty[i]}','${d.total[i]}','${b.insertId}','${d.up[i]}')`);
        let qt = await exe(`select * from stocks where id='${d.product[i]}' `);
        if (d.isPack[i] == 'false') {
            let uqty = await exe(`update stocks set qty='${((qt[0].packing.split(" ")[0]*qt[0].qty)-d.qty[i])/qt[0].packing.split(" ")[0]}' where id='${d.product[i]}'`);
        } else {
            let uqty = await exe(`update stocks set qty='${qt[0].qty-d.qty[i]}' where id='${d.product[i]}'`);
        }
    }
    let bd = await exe(`insert into bill_det(disc,ttl,net_ttl,pmtd,psts,pmny,rmny,bill_id,gst) values('${d.discount}','${d.ttl_amt}','${d.net_ttl}','${d.pmtd}','${d.psts}','${d.pmny}','${d.rmny}','${b.insertId}','${d.gst}')`);

    res.send(b.insertId + "");

})
route.get("/invoice/:id", checkAdmin, async(req, res) => {
    var details = await exe(`select * from mdetails where m_id = '1'`)
    let bill = await exe(`select* from bill where id='${req.params.id}'`);
    let cus = await exe(`select*from customer where cid='${bill[0].cid}'`)
    let med = await exe(`select*,(select pname from stocks where order_list.product=stocks.id)as pname,(select packing from stocks where order_list.product=stocks.id)as pack from order_list where bill_id='${req.params.id}'`);
    let det = await exe(`select*from bill_det where bill_id='${req.params.id}'`);
    var img = await exe(`select * from userlogin`)
    var obj = { "img": img[0], "cus": cus[0], 'bill': bill[0], "med": med, 'det': det[0], "details": details[0] };
    res.render("admin/invoice.ejs", obj);

})
route.get('/bill-list', checkAdmin, async(req, res) => {
    let bill = await exe('select*,(select cname from customer where customer.cid=bill.cid) as cname,(select net_ttl from bill_det where bill_det.bill_id=bill.id) as ttl from bill');
    var img = await exe(`select * from userlogin`)
    var obj = { "img": img[0], 'bill': bill };
    res.render("admin/billlist.ejs", obj);
})
route.get("/delete-bill/:id", checkAdmin, async(req, res) => {
    let b = await exe(`delete from bill where id='${req.params.id}'`);
    res.redirect("/bill-list");
})


route.get("/total-exp", checkAdmin, async(req, res) => {

    let bill = await exe(`select *,(select net_ttl from bill_det where bill_det.bill_id=bill.id) as exp,(select cname from customer where customer.cid=bill.cid) as cname from bill`);

    let bar = [];
    let lastExp = 0;
    let lastm = new Date().getMonth() - 1;
    if (lastm < 0) {
        lastm = 11;
    }
    let curExp = 0;
    for (let b of bill) {
        if ((new Date(b.pdate).getMonth()) == (new Date().getMonth())) {
            bar.push(b);
            curExp = Number(curExp) + b.exp;
        } else if (lastm == new Date(b.pdate).getMonth()) {
            lastExp = Number(lastExp) + b.exp;
        }


    }

    var img = await exe(`select * from userlogin`)
    let obj = {
        'bill': bar,
        "img": img[0],
        "lastexp": lastExp,
        "curExp": curExp
    }
    res.render('admin/exptable.ejs', obj);
})
route.get("/total-purchase", checkAdmin, async(req, res) => {
    let list = await exe(`select*,(select name from vendor where product.party=vendor.id) as vendor from product `);
    let bar = [];
    let lastExp = 0;
    let lastm = new Date().getMonth() - 1;
    if (lastm < 0) {
        lastm = 11;
    }
    let curExp = 0;
    for (let b of list) {
        if ((new Date(b.adddate).getMonth()) == (new Date().getMonth())) {
            bar.push(b);
            curExp = Number(curExp) + b.amt;
        } else if (lastm == new Date(b.adddate).getMonth()) {
            lastExp = Number(lastExp) + b.amt;
        }


    }
    var img = await exe(`select * from userlogin`)
    let obj = {
        'list': bar,
        "img": img[0],
        "lastexp": lastExp,
        "curExp": curExp
    }
    res.render('admin/purtable.ejs', obj);
})

route.get("/todays-sells", checkAdmin, async(req, res) => {
    let bill = await exe(`select *,(select net_ttl from bill_det where bill_det.bill_id=bill.id) as exp,(select cname from customer where customer.cid=bill.cid) as cname from bill`);
    let bar = [];
    for (let b of bill) {
        if ((new Date(b.pdate).toISOString().slice(0, 10)) == (new Date().toISOString().slice(0, 10))) {
            bar.push(b);

        }



    }
    var img = await exe(`select * from userlogin`)
    let obj = {
        'bill': bar,
        "img": img[0],
    }
    res.render("admin/todayssells.ejs", obj);
})
route.get("/todays-expense", checkAdmin, async(req, res) => {

    let list = await exe(`select*,(select name from vendor where product.party=vendor.id) as vendor from product `);
    let bar = [];
    for (let b of list) {
        if ((new Date(b.adddate).toISOString().slice(0, 10)) == (new Date().toISOString().slice(0, 10))) {
            bar.push(b);

        }



    }
    var img = await exe(`select * from userlogin`)
    let obj = {
        'list': bar,
        "img": img[0],
    }
    res.render("admin/todayspruchase.ejs", obj);
})
route.get("/add-note", checkAdmin, async(req, res) => {
    var img = await exe(`select * from userlogin`)
    let obj = {

        "img": img[0],
    }
    res.render("admin/addnote.ejs", obj);

})
route.post("/save-note", async(req, res) => {
    let d = req.body;
    let b = await exe(`insert into notes(name,mobile,person,address,payment_type,amount,notify,note,isRead) value('${d.name}','${d.mobile}','${d.person}','${d.add}',
    '${d.payment_type}','${d.amount}','${d.notification}','${d.note}','${'false'}')`);
    res.redirect("/add-note");

})
route.get("/get-notes", checkAdmin, async(req, res) => {
    let d = await exe(`select*from notes`);
    let got = 0,
        give = 0;
    let noti = [];
    for (let i of d) {
        if (i.payment_type == 'true') {
            got = Number(got) + Number(i.amount);
            if (new Date(i.notify).toISOString().slice(0, 10) == new Date().toISOString().slice(0, 10)) {
                noti.push(i);
            }
        } else if (i.payment_type == 'false') {
            give = Number(give) + Number(i.amount);
            if (new Date(i.notify).toISOString().slice(0, 10) == new Date().toISOString().slice(0, 10)) {
                noti.push(i);
            }
        }

    }
    var img = await exe(`select * from userlogin`)
    let obj = {
        "data": d,
        "got": got,
        "give": give,
        "noti": noti,
        "img": img[0]
    }
    res.render("admin/notes.ejs", obj);
})
route.get("/view-vendor-order/:id", checkAdmin, async(req, res) => {
    let d = await exe(`select * from product_bill where vendor='${req.params.id}'`)
    let ven = await exe(`select*from vendor where id='${req.params.id}'`);
    var img = await exe(`select * from userlogin`)
    let obj = {
        "data": d,
        "img": img[0],
        "v": ven[0]
    }
    res.render("admin/viewvendororder.ejs", obj);

})
route.get("/delete-purchase-bill/:bid/:vid", checkAdmin, async(req, res) => {
    let d = await exe(`delete from product_bill where id='${req.params.bid}' `);
    res.redirect("/view-vendor-order/" + req.params.vid);
})
route.get("/medicine", checkAdmin, async(req, res) => {
    let data = "";
    var img = await exe(`select * from userlogin`)
    if (req.query.warn == 'oos') {
        data = await exe(`select*from stocks where qty=0`);
    } else {
        data = await exe(`select*from stocks where isExpired=1`);
    }
    let status = (req.query.warn == 'oos') ? 'Out of stock' : 'Expired';
    let obj = {
        "d": data,
        "img": img[0],
        "status": status
    }
    res.render("admin/medicinewarn.ejs", obj);
})




route.get('/mdetails', checkAdmin, async function(req, res) {
    var img = await exe(`select * from userlogin`)
    var data = await exe(`select * from mdetails`)

    var obj = { "data": data[0], "img": img[0] }
    res.render("admin/medical_details.ejs", obj)
})

route.post("/save_details", async function(req, res) {


    var d = req.body;

    var sql = `update mdetails set m_email = '${d.m_email}', m_mobile = '${d.m_mobile}', m_address = '${d.m_address}' where m_id = '1' `

    var data = await exe(sql)

    res.redirect("/mdetails")

})

route.get("/credits", async function(req, res) {


    var img = await exe(`select * from userlogin`)
    var customer = await exe(`select * from credit `)

    var c_ttl = await exe(`select sum(credit_amount) as c_ttl from cd_transaction `)
    var d_ttl = await exe(`select sum(debit_amount) as d_ttl from cd_transaction`)


    var obj = { "img": img[0], "customer": customer, "c_ttl": c_ttl[0], "d_ttl": d_ttl[0] }





    res.render("admin/credit.ejs", obj)
})

route.post("/save_credit", async function(req, res) {
    var d = req.body
    let c = d.c_mobile;
    var sql = `insert into credit (c_name, c_mobile, c_add) values ('${d.c_name}','${c.toString()}','${d.c_add}') `
    var data = await exe(sql)

    // res.send("<script>location : document.referrer</script>")
    //res.send(d)
    res.redirect("/credits")

})

route.get("/edit_credit/:credit_id", async function(req, res) {
    var img = await exe(`select * from userlogin`)
    var data = await exe(`select * from credit where credit_id = '${req.params.credit_id}'`)

    var obj = { "img": img[0], "data": data[0] }

    res.render("admin/credit_edit.ejs", obj)
        // res.send(data)  
})

route.post("/credit_edit", async function(req, res) {

    var d = req.body
    var sql = ` update credit set c_name = '${d.c_name}' , c_mobile = '${d.c_mobile}' , c_add = '${d.c_add}' where credit_id = '${d.credit_id}' `

    var data = await exe(sql)

    res.redirect("/credits")

})

route.get("/credit_history/:credit_id", async function(req, res) {
    var img = await exe(`select * from userlogin`)
    var customer = await exe(`SELECT * FROM credit where credit_id = '${req.params.credit_id}'`)

    // var allcust = await exe(`select * from cd_transaction,credit where
    //                             cd_transaction.credit_id = credit.credit_id
    //                             and cd_transaction.credit_id  = '${req.params.credit_id}'
    //                                 `)

    // let allcust=await exe(`select*,(select note from cd_transaction where cd_transaction.credit_id=credit.credit_id) as notes from credit where credit_id='${req.params.credit_id}'`);


    var allcust = await exe(`select * from cd_transaction where credit_id = '${req.params.credit_id}'`)

    var sum = await exe(`select sum(credit_amount) as c_amount from cd_transaction where credit_id = '${req.params.credit_id}'`)

    var sum1 = await exe(`select sum(debit_amount) as d_amount from cd_transaction where credit_id = '${req.params.credit_id}' `)



    var obj = { "img": img[0], "data": customer[0], "allcust": allcust, "c_amount": sum[0], "d_amount": sum1[0] }

    res.render("admin/credit_history.ejs", obj)
        // res.send(allcust)
})

route.post("/add_credit", async function(req, res) {
    var d = req.body

    // var sql = `update credit set amount = '${d.amount}' , note = '${d.note}' where credit_id = '${d.credit_id}' `

    // var sql = `insert into credit (amount,note) values('${d.amount}','${d.note}' where credit_id = '${d.credit_id}' )`

    var sql = `insert into cd_transaction (credit_id , note, credit_amount,date,debit_amount) values ('${d.credit_id}','${d.note}','${d.credit_amount}','${new Date().toISOString().slice(0,10)}','${d.debit_amount}' )
     `

    var data = await exe(sql)

    // res.send("<script>location.href = document.referrer</script>")

    res.send("<script>location.href = document.referrer;</script>")
})


route.post("/add_debit", async function(req, res) {

    var d = req.body;

    var sql = `insert into cd_transaction (credit_id , note, credit_amount,date,debit_amount) values ('${d.credit_id}','${d.note}','${d.credit_amount}','${new Date().toISOString().slice(0,10)}','${d.debit_amount}')`

    var data = await exe(sql)

    res.send("<script>location.href = document.referrer;</script>")
})

route.get("/back", function(req, res) {

    res.redirect("/credits")
})



route.get("/delete-stock/:id", checkAdmin, async(req, res) => {
    let d = await exe(`delete from stocks where id='${req.params.id}'`)
    res.redirect("/stocks");
})



module.exports = route;