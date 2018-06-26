<input type="button" value="Click me!" onclick="
            var row = document.getElementsByClassName('row-fluid item-li');
            var p = document.getElementsByTagName('body')[0];
            var final_text = '';
            var i;
            //alert(row.length);
            for(i = 0; i < row.length; i++) {
               //alert(i);
               var buy_price = 1;
               var sell_price = -1;
               var this_row = row[i];
               var name = this_row.getElementsByClassName('item-name')[0].innerHTML;
               var set_name = document.getElementsByTagName('h1')[0].innerHTML;
               var sets;
               var set_text;
               var good_set;
               var isNumber;
               var set;
               var buy;
               var sell;
               
               var dd = this_row.getElementsByTagName('dd');
               
               if(set_name == null) {
                  sets = this_row.getElementsByClassName('item-set');
                  set_text;
                  set = '';
               
               good_set = false;
               if(sets != undefined && sets.length > 0) {
                  good_set = true;
                  
                  var links = sets[0].getElementsByTagName('a');
                  set_text = links[0].innerHTML;
                  isNumber = false;
                  for(j = 0; set_text[j] != '<'; j++) {
                     if((set_text[j] != ' ' && set_text[j] != null && set_text[j] != undefined && set_text[j] != '\n') || ((set_text[j-1] != ' ' && set_text[j-1] != null && set_text[j-1] != undefined && set_text[j-1] != '\n') && (set_text[j+1] != ' ' && set_text[j+1] != null && set_text[j+1] != undefined && set_text[j+1] != '\n'))) {
                        set += set_text[j];
                        isNumber = true;
                     }
                     else {
                        if(isNumber == true) {
                           break;
                        }
                     }
                  }
               }
               }
               else {
                  good_set = true;
                  set = set_name;
                  //alert('set: ' + set);
               }
               
               var cat_text = this_row.getElementsByClassName('item-category')[0].innerHTML;
               var cat = '';
               isNumber = false;
               
               for(j = 0; cat_text[j] != '<'; j++) {
                     if((cat_text[j] != ' ' && cat_text[j] != null && cat_text[j] != undefined && cat_text[j] != '\n') || ((cat_text[j-1] != ' ' && cat_text[j-1] != null && cat_text[j-1] != undefined && cat_text[j-1] != '\n') && (cat_text[j+1] != ' ' && cat_text[j+1] != null && cat_text[j+1] != undefined && cat_text[j+1] != '\n'))) {
                        cat += cat_text[j];
                        isNumber = true;
                     }
                     else {
                        if(isNumber == true) {
                           break;
                        }
                     }
                  }
               //alert('cat: ' + cat);
               if(/*cat != 'Bottoms' && cat != 'Tops' && cat != 'Hats' && cat != 'Dresses' && cat != 'Tools' */cat != 'Wallpaper' && cat != 'Flooring')
               {
               
               if(buy_price == -1) {
               var buy_text = dd[1].innerHTML;
               buy = '';
               
               var j;
               isNumber = false;
               for(j = 0; buy_text[j] != '<'; j++) {
                  if(buy_text[j] == '0' || buy_text[j] == '1' || buy_text[j] == '2' || buy_text[j] == '3' || buy_text[j] == '4' || buy_text[j] == '5' || buy_text[j] == '6' || buy_text[j] == '7' || buy_text[j] == '8' || buy_text[j] == '9' || buy_text[j] == ',') {
                  if(buy_text[j] != ',')
                     buy += buy_text[j];
					  isNumber = true;
                  }
                  else {
                  	if(isNumber == true) {
                        break;
                     }
                  }
               }
               }
               
               if(sell_price == -1){
                  var sell_text = '';
                  if(buy_price != -1)
                     sell_text = dd[1].innerHTML;
                  else
                     sell_text = dd[2].innerHTML;
                  sell = '';
                  
                  isNumber = false;
               for(j = 0; sell_text[j] != '<'; j++) {
                  //alert(sell_text[j]);
                  if(sell_text[j] == '0' || sell_text[j] == '1' || sell_text[j] == '2' || sell_text[j] == '3' || sell_text[j] == '4' || sell_text[j] == '5' || sell_text[j] == '6' || sell_text[j] == '7' || sell_text[j] == '8' || sell_text[j] == '9' || sell_text[j] == ',') {
                  if(sell_text[j] != ',')
                     sell += sell_text[j];
					  isNumber = true;
                  }
                  else {
                  	if(isNumber == true) {
                        break;
                     }
                  }
               }
               }
               
               if(sell_price != -1 && buy_price == -1) {
                  sell = buy / 4;
               }
               else if(buy_price != -1 && sell_price == -1) {
                  buy = sell * 4;
               }
               else if(buy_price != -1 && sell_price != -1) {
                  buy = buy_price;
                  sell = sell_price;
               }
               
               buy -= buy % 50; //Round to lowest 50
               sell -= sell % 50; //Round to lowest 50
               
               var url = this_row.getElementsByTagName('img')[0].src;
               final_text += 'INSERT INTO item (item_name, buy_price, sell_price, ';
               
               if(good_set) {
                  final_text += 'set, ';
               }
               
               final_text += 'img_url) VALUES (abcd' + name + 'abcd, ' + buy + ', ' + sell + ', ';
               if(good_set) {
                  final_text += 'abcd' + set + 'abcd, ';
               }
               final_text += 'abcd' + url + 'abcd);<br>';
               }
            }
            p.innerHTML = final_text;
                                                ">
 
 