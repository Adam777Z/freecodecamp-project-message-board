/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;

module.exports = function (app) {
  
  app.route('/api/threads/:board')
  .get(function(req, res) {
    var board = req.params.board;
    
    MongoClient.connect(process.env.DATABASE, { useNewUrlParser: true }, function(err, db) {
      if (err) {
        // console.log('Database error: ' + err);
        return res.json({ error: 'error' });
      } else {
        db.db().collection('messageboard').find(
          {
            board
          },
          {
            sort: {
              bumped_on: -1
            },
            limit: 10,
            projection: {
              delete_password: 0,
              reported: 0,
              'replies.delete_password': 0,
              'replies.reported': 0
            }
          }
        ).toArray(function(err, docs) {
          docs.forEach(function(doc) {
            doc.replycount = doc.replies.length;
            
            if (doc.replycount > 3) {
              doc.replies = doc.replies.slice(-3);
            }
          });
          
          return res.json(docs);
        });
      }
    });
  })
  .post(function(req, res) {
    var board = req.params.board;
    
    if (req.body.text === undefined) {
      return res.json({ error: 'Text is required' });
    }
    
    let text = req.body.text;
    
    if (req.body.delete_password === undefined) {
      return res.json({ error: 'Delete password is required' });
    }
    
    let delete_password = req.body.delete_password;
    
    let date = new Date();
    
    MongoClient.connect(process.env.DATABASE, { useNewUrlParser: true }, function(err, db) {
      if (err) {
        // console.log('Database error: ' + err);
        return res.json({ error: 'error' });
      } else {
        db.db().collection('messageboard').insertOne(
          {
            board: board,
            text: text,
            delete_password: delete_password,
            created_on: date,
            bumped_on: date,
            reported: false,
            replies: []
          }, function(err, doc) {
            return res.redirect('/b/' + board);
          }
        );
      }
    });
  })
  .put(function(req, res) {
    var board = req.params.board;
    
    if (req.body.thread_id === undefined) {
      return res.json('Thread ID is required');
    }
    
    let thread_id = req.body.thread_id;
    
    MongoClient.connect(process.env.DATABASE, { useNewUrlParser: true }, function(err, db) {
      if (err) {
        // console.log('Database error: ' + err);
        return res.json({ error: 'error' });
      } else {
        db.db().collection('messageboard').findOneAndUpdate(
          {
            board: board,
            _id: new ObjectId(thread_id)
          },
          { $set: {
              reported: true
            }
          },
          { returnOriginal: false }, // Return updated object after modify
          function(error, result) {
            if (result.ok === 1 && result.value !== null) {
              return res.json('success');
            } else {
              return res.json('failure');
            }
          }
        );
      }
    });
  })
  .delete(function(req, res) {
    var board = req.params.board;
    
    if (req.body.thread_id === undefined) {
      return res.json({ error: 'Thread ID is required' });
    }
    
    let thread_id = req.body.thread_id;
    
    if (req.body.delete_password === undefined) {
      return res.json({ error: 'Delete password is required' });
    }
    
    let delete_password = req.body.delete_password;
    
    MongoClient.connect(process.env.DATABASE, { useNewUrlParser: true }, function(err, db) {
      if (err) {
        // console.log('Database error: ' + err);
        return res.json({ error: 'error' });
      } else {
        db.db().collection('messageboard').findOneAndDelete(
          {
            board: board,
            _id: new ObjectId(thread_id),
            delete_password
          },
          function(error, result) {
            if (result.ok === 1 && result.value !== null) {
              return res.json('success');
            } else {
              return res.json('incorrect password'); // or it no longer exists (delete unsuccessful)
            }
          }
        );
      }
    });
  });
  
  app.route('/api/replies/:board')
  .get(function(req, res) {
    var board = req.params.board;
    
    if (req.query.thread_id === undefined) {
      return res.json({ error: 'Thread ID is required' });
    }
    
    let thread_id = req.query.thread_id;
    
    MongoClient.connect(process.env.DATABASE, { useNewUrlParser: true }, function(err, db) {
      if (err) {
        // console.log('Database error: ' + err);
        return res.json({ error: 'error' });
      } else {
        db.db().collection('messageboard').find(
          {
            board,
            _id: new ObjectId(thread_id)
          },
          {
            sort: {
              created_on: -1
            },
            projection: {
              delete_password: 0,
              reported: 0,
              'replies.delete_password': 0,
              'replies.reported': 0
            }
          }
        ).toArray(function(err, docs) {
          return res.json(docs[0]);
        });
      }
    });
  })
  .post(function(req, res) {
    var board = req.params.board;
    
    if (req.body.thread_id === undefined) {
      return res.json({ error: 'Thread ID is required' });
    }
    
    let thread_id = req.body.thread_id;
    
    if (req.body.text === undefined) {
      return res.json({ error: 'Text is required' });
    }
    
    let text = req.body.text;
    
    if (req.body.delete_password === undefined) {
      return res.json({ error: 'Delete password is required' });
    }
    
    let delete_password = req.body.delete_password;
    
    let date = new Date();
    
    MongoClient.connect(process.env.DATABASE, { useNewUrlParser: true }, function(err, db) {
      if (err) {
        // console.log('Database error: ' + err);
        return res.json({ error: 'error' });
      } else {
        db.db().collection('messageboard').findOneAndUpdate(
          {
            board: board,
            _id: new ObjectId(thread_id)
          },
          {
            $set: {
              bumped_on: date
            },
            $push: {
              replies: {
                _id: new ObjectId(),
                text: text,
                delete_password: delete_password,
                created_on: date,
                reported: false
              }
            }
          },
          { returnOriginal: false }, // Return updated object after modify
          function(err, doc) {
            return res.redirect('/b/' + board + '/' + thread_id);
          }
        );
      }
    });
  })
  .put(function(req, res) {
    var board = req.params.board;
    
    if (req.body.thread_id === undefined) {
      return res.json('Thread ID is required');
    }
    
    let thread_id = req.body.thread_id;
    
    if (req.body.reply_id === undefined) {
      return res.json('Reply ID is required');
    }
    
    let reply_id = req.body.reply_id;
    
    MongoClient.connect(process.env.DATABASE, { useNewUrlParser: true }, function(err, db) {
      if (err) {
        // console.log('Database error: ' + err);
        return res.json({ error: 'error' });
      } else {
        db.db().collection('messageboard').findOneAndUpdate(
          {
            board: board,
            _id: new ObjectId(thread_id),
            replies: {
              $elemMatch: {
                _id: new ObjectId(reply_id)
              }
            }
          },
          { $set: {
              'replies.$.reported': true
            }
          },
          { returnOriginal: false }, // Return updated object after modify
          function(error, result) {
            if (result.ok === 1 && result.value !== null) {
              return res.json('success');
            } else {
              return res.json('failure');
            }
          }
        );
      }
    });
  })
  .delete(function(req, res) {
    var board = req.params.board;
    
    if (req.body.thread_id === undefined) {
      return res.json({ error: 'Thread ID is required' });
    }
    
    let thread_id = req.body.thread_id;
    
    if (req.body.reply_id === undefined) {
      return res.json({ error: 'Reply ID is required' });
    }
    
    let reply_id = req.body.reply_id;
    
    if (req.body.delete_password === undefined) {
      return res.json({ error: 'Delete password is required' });
    }
    
    let delete_password = req.body.delete_password;
    
    MongoClient.connect(process.env.DATABASE, { useNewUrlParser: true }, function(err, db) {
      if (err) {
        // console.log('Database error: ' + err);
        return res.json({ error: 'error' });
      } else {
        db.db().collection('messageboard').findOneAndUpdate(
          {
            board: board,
            _id: new ObjectId(thread_id),
            replies: {
              $elemMatch: {
                _id: new ObjectId(reply_id),
                delete_password: delete_password
              }
            }
          },
          {
            $set: {
              'replies.$.text': '[deleted]'
            }
          },
          { returnOriginal: false }, // Return updated object after modify
          function(err, doc) {
            if (doc.ok === 1 && doc.value !== null) {
              return res.json('success');
            } else {
              return res.json('incorrect password'); // or it no longer exists (delete unsuccessful)
            }
          }
        );
      }
    });
  });

};
