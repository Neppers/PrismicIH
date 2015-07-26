var express = require('express');
var router = express.Router();
var Prismic = require('prismic.io').Prismic;

var accessToken = "";

router.get('*', function(req, res, next) {
    var path = req.params[0].split('/');
    path.shift();
        
    if (typeof path[0] === "undefined" || path[0] === "") return next(); // Leave route if nothing nested TODO: This is a bit shoddy
    
    Prismic.Api('https://av-test.prismic.io/api', function(err, Api) {
        // Check if root node is a bookmark
        var rootId = Api.data.bookmarks[path[0]];
        
        if (!rootId) return next();
        
        var crumbs = [];
        
        Api.form('everything')
            .ref(Api.master())
            .query(Prismic.Predicates.at("document.id", rootId)).submit(function(err, response) {
                var doc = response.results[0];
                var children = doc.getGroup(doc.type + '.children');
                children = children ? children.toArray() : [];

                crumbs.push({
                    uri: doc.uid,
                    type: doc.type,
                    title: doc.getStructuredText(doc.type + '.title').asText()
                });
                
                var childFound = false;
                
                for (var i = 0; i < children.length; i++) {
                    var source = children[i].getLink('link');
                    if (source.slug === path[1]) {
                        childFound = true;
                        Api.form('everything')
                            .ref(Api.master())
                            .query(Prismic.Predicates.at("document.id", source.id)).submit(function(err, response) {
                                var doc = response.results[0];
                                var children = doc.getGroup(doc.type + '.children');
                                children = children ? children.toArray() : [];
                                
                                crumbs.push({
                                    uri: doc.uid,
                                    type: doc.type,
                                    title: doc.getStructuredText(doc.type + '.title').asText()
                                });
                                
                                var childFound = false;
                                for (var i = 0; i < children.length; i++) {
                                    var source = children[i].getLink('link');
                                    if (source.slug === path[2]) {
                                        childFound = true;
                                        Api.form('everything')
                                            .ref(Api.master())
                                            .query(Prismic.Predicates.at("document.id", source.id)).submit(function(err, response) {
                                                var doc = response.results[0];
                                                
                                                crumbs.push({
                                                    uri: doc.uid,
                                                    type: doc.type,
                                                    title: doc.getStructuredText(doc.type + '.title').asText()
                                                });
                                                
                                                res.render('index', {
                                                    doc: doc,
                                                    path: path,
                                                    crumbs: crumbs
                                                })
                                            });
                                    }
                                }
                                
                                if (!childFound) return next();
                            });
                    }
                }
                
                if (!childFound) return next();
                
            });
        
    }, accessToken);
    
    
});

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
