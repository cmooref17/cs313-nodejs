CREATE TABLE "user"
(
   id SERIAL PRIMARY KEY,
   first_name VARCHAR(100) NOT NULL,
   last_name VARCHAR(100) NOT NULL,
   password VARCHAR(255) NOT NULL,
   username VARCHAR(100) UNIQUE NOT NULL,
   email VARCHAR(100) UNIQUE NOT NULL,
   bells INT DEFAULT(100),
   gift_date DATE,
   num_gifts INT DEFAULT(4),
   gift_0 INT DEFAULT(-1) REFERENCES item(id),
   gift_1 INT DEFAULT(-1) REFERENCES item(id),
   gift_2 INT DEFAULT(-1) REFERENCES item(id),
   gift_3 INT DEFAULT(-1) REFERENCES item(id),
   num_shop INT DEFAULT(10),
   shop_0 INT DEFAULT(-1) REFERENCES item(id),
   shop_1 INT DEFAULT(-1) REFERENCES item(id),
   shop_2 INT DEFAULT(-1) REFERENCES item(id),
   shop_3 INT DEFAULT(-1) REFERENCES item(id),
   shop_4 INT DEFAULT(-1) REFERENCES item(id),
   shop_5 INT DEFAULT(-1) REFERENCES item(id),
   shop_6 INT DEFAULT(-1) REFERENCES item(id),
   shop_7 INT DEFAULT(-1) REFERENCES item(id),
   shop_8 INT DEFAULT(-1) REFERENCES item(id),
   shop_9 INT DEFAULT(-1) REFERENCES item(id)
);

ALTER TABLE "user" ADD gift_0 INT DEFAULT(-1) REFERENCES item(id);

ALTER TABLE "user" ADD num_gifts INT DEFAULT(4);

UPDATE item SET rarity = 1 WHERE buy_price >= 12150;

CREATE TABLE item
(
   id SERIAL PRIMARY KEY,
   item_name VARCHAR(100) UNIQUE NOT NULL,
   buy_price INT,
   sell_price INT,
   set VARCHAR(50),
   img_url VARCHAR(1000) NOT NULL
);

CREATE TABLE inventory
(
   id SERIAL PRIMARY KEY,
   owner VARCHAR(100) NOT NULL REFERENCES "user"(username),
   item_id INT NOT NULL REFERENCES item(id),
   count INT default(1)
);

CREATE TABLE trade
(
   id SERIAL PRIMARY KEY,
   owner VARCHAR(100) NOT NULL REFERENCES "user"(username),
   item_offered INT NOT NULL REFERENCES item(id),
   item_requested INT REFERENCES item(id),
   trade_completed_by VARCHAR(100) DEFAULT(null) REFERENCES "user"(username),
   trade_completed BOOLEAN DEFAULT(false)
);