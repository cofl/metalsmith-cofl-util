var cheerio = require('cheerio');

module.exports = function(opts){
  return function(files, metalsmith, done){
    Object.keys(files).forEach(function(file){
      if(!(/\.html?$/i).test(file))
        return;
      //process files
      var data = files[file];
      if(!("generate" in data))
        return;
      console.log(file);
      var $ = cheerio.load(data.contents.toString());
      if("nav" in data["generate"] && data["generate"]["nav"]){
        // generate navigation
        var nav = $("div#nav");
        if(nav.length==0){
          $.root().append('<div id="nav"></div>');
          nav = $("div#nav");
        }
        if(nav.children().length==0)
          nav.append('<div style="padding:0;margin:10px 0"><span id="tocm">TOC</span></div>');
        nav = nav.children().first();
        // header
        if("templates" in data && "header-top" in data["templates"])
          nav.append($(data["templates"]["header-top"]));
        // actual generation
        var level = false;
        $("h1,h2,h3,h4,h5,h6").each(function(){
          var elem = $(this);
          if(elem.find("a").length==0){
            var lvl = parseInt(elem[0].tagName.charAt(1)); // /h(\d)/
            if(level === false)
              level = lvl; //first-time
            while(lvl > level){
              // go down through spans until we're at the right level.
              var n = $("<span></span>");
              nav.append(n);
              nav = nav.children().last();
              level++;
            }
            while(lvl < level){
              // retreat back through the spans until we're at the right level.
              nav = nav.parent();
              level--;
            }
            // make and add link to nav
            var tlem = $("<a></a>");
            var link = elem.text().replace(/ /g,"_").toLowerCase();
            tlem.attr("href", "#" + link);
            tlem.html(elem.text());
            nav.append(tlem);
            // update header in page
            elem.html('<a name="'+link+'"></a>' + elem.html() + ' <a href="#'+ link +'" class="fa fa-link link-icon"></a>');
          }
        });
        // footer
        if("templates" in data && "header-top" in data["templates"])
          nav.append($(data["templates"]["header-trail"]));
      }
      if("clone" in data["generate"] && data["generate"]["clone"]){
        // clone attributes to sibling
        $("clone").each(function(){
          var node = $(this);
          var rem = node;
          var next = node.next();
          if(next.length == 0 && node.parent()[0].name == "p"){
            rem = node.parent();
            next = rem.next();
          }
          if(next.length != 0 && Object.keys(node.attr()).length != 0)
            cloneAttributes(node, next, rem);
        });
        // clone-p clones to parent
        $("clone-p").each(function(){
          var node = $(this);
          cloneAttributes(node, node.parent(), node);
        });
        // change the first td of a table.row-headers tr to th
        $("table.row-headers td:first-child").each(function(){var node = $(this);node[0].name="th";});
      }
      data.contents = new Buffer($.html());
    });
    done(); // and done
  };
};

function cloneAttributes(src, dest, rem){
  var old_attrs = src.attr();
  for(var attrib in old_attrs){
    if(dest.attr(attrib)!==undefined){
      if(attrib == "class"){
        dest.attr("class", (dest.attr("class") + " " + old_attrs["class"]).replace(/\s+/g, " "));
      } else if(attrib == "style"){
        var cur = dest.attr("style");
        if(cur.charAt(cur.length-1)!=";") cur += ";";
        dest.attr("style", cur + old_attrs["style"]);
      }
    } else dest.attr(attrib, old_attrs[attrib]);
  }
  rem.remove();
}