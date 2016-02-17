/*
================================================================================
© 2015 <3 + $

@author Daniel Courtness
================================================================================
*/
(function() {
  'use strict';

  angular
      .module('dovetail-digital.tracey.data')
      .factory('api', api)
      .factory('UserJsonService', UserJsonService)
      .factory('AccountsJsonService', AccountsJsonService)
      .factory('UserAccountsJsonService' , UserAccountsJsonService) 
      .factory('JobsJsonService', JobsJsonService)
      .factory('CommentsJsonService', CommentsJsonService)
      .factory("UserPasswordsJsonService", UserPasswordsJsonService)
      .factory("UserInvitationsJsonService", UserInvitationsJsonService)
      .factory('CommentsCache', CommentsCache)
      .factory('AttachmentsCache', AttachmentsCache)
      .factory('Categories', Categories);
 

  /* @ngInject */
  function api(CONNECTION) {
    return {
      url : url
    };

    ////////////

    function url(path) {
      return CONNECTION.host + path;
    }
  }


  /* ---------------------------------------------------------------------------
   *  u s e r
   */

  /* @ngInject */
  function UserJsonService($resource, api) {
    var service = {
      User : User
    };

    return service;

    ////////////

    function User(userId) {
      return $resource(api.url('/users/' + userId + '.json'), null,
        { 'get' : { method : 'GET' } }
      );
    }
  }

  /* ---------------------------------------------------------------------------
   *  a c c o u n t s
   */

  /* @ngInject */
  function AccountsJsonService($resource, api) {
    return {
      Accounts : Accounts,
      Account  : Account
    };

    ////////////

    function Accounts() {
      return $resource(api.url('/accounts.json'), null,
        {
          'get'  : { method : 'GET', isArray : true },
          'save' : { method : 'POST' }
        }
      );
    }

    function Account(id) {
      return $resource(api.url('/accounts/' + id + '.json'), null,
        { 'get' : { method : 'GET' } }
      );
    }
  }

    /* ---------------------------------------------------------------------------
   *  u s e r  a c c o u n t s - subscribe users to accounts 
   */

  /* @ngInject */
  function UserAccountsJsonService($resource, api){
      return {
        UserAccounts: function(){
            return $resource( api.url("/user_accounts.json"), null, null );
          }
      };
  }

    /* ---------------------------------------------------------------------------
   *  u s e r  p a s s w o r d s - reset a users password
   */

  /* @ngInject */
  function UserPasswordsJsonService($resource, api) {
    return {
      UserPasswords: function() {
        return $resource(api.url("/users/password.json"), null, {
          'update': {
            method: 'PUT'
          }
        });
      }
    }
  }

  /* ---------------------------------------------------------------------------
   *  u s e r  i n v i t a t i o n s - invite a user to tracey
   */

  /* @ngInject */
  function UserInvitationsJsonService($resource, api) {
    return {
      UserInvitations: function() {
        return $resource(api.url("/users/invitation.json"), null, {
          'update': {
            method: 'PUT'
          }
        });
      }
    }
  }

  /* ---------------------------------------------------------------------------
   *  j o b s
   */

  /* @ngInject */
  function JobsJsonService($resource, api) {
    return {
      Jobs : Jobs,
      Job  : Job
    }

    ////////////

    function Jobs(accountId) {
      return $resource(api.url('/accounts/' + accountId + '/jobs.json'), null,
        {
          'get'  : { method : 'GET', isArray : true },
          'save' : { method : 'POST' }
        }
      );
    }

    function Job(accountId, jobId) {
      return $resource(api.url('/accounts/' + accountId + '/jobs/' + jobId + '.json'), null,
        {
          'get'   : { method : 'GET' },
          'update' : { method : 'PUT' }
        }
      );
    }
  }

  /* ---------------------------------------------------------------------------
   *  c o m m e n t s
   */

  /* @ngInject */
  function CommentsJsonService($resource, api) {
    return {
      Comments : Comments
    };

    ////////////

    function Comments(accountId, jobId) {
      return $resource(api.url('/accounts/' + accountId + '/jobs/' + jobId + '/comments.json'), null,
        {
          'get'  : { method : 'GET', isArray : true },
          'save' : { method : 'POST' }
        }
      );
    }
  }

  /* @ngInject */
  function CommentsCache($rootScope) {
    var comments = [];

    return {
      save    : save,
      get     : get,
      refresh : refresh
    }

    ////////////

    function save(newComments) {
      comments = [];

      for (var i = 0; i < newComments.length; i++) {
        comments.push(newComments[i]);
      }

      comments.sortBy(function(o) {
        return new Date(o.created_at)
      });

      refresh();
    }

    function get() {
      return comments;
    }

    function refresh() {
      for (var i = 0; i < comments.length; i++) {
        var timeDiff = getTimeDifference(new Date(comments[i].created_at));
        var timeDiffStr = '';

        if (timeDiff.days > 0) {
          if (timeDiff.days == 1) {
            timeDiffStr = timeDiff.days + " day ago";
          } else {
            timeDiffStr = timeDiff.days + " days ago";
          }

        } else if (timeDiff.hours > 0) {
          if (timeDiff.hours == 1) {
            timeDiffStr = timeDiff.hours + " hour ago";
          } else {
            timeDiffStr = timeDiff.hours + " hours ago";
          }

        } else if (timeDiff.minutes > 0 || timeDiff.seconds > 59) {
          if (timeDiff.minutes == 1) {
            timeDiffStr = timeDiff.minutes + " minute ago";
          } else {
            timeDiffStr = timeDiff.minutes + " minutes ago";
          }

        } else {
          if (timeDiff.seconds < 30) {
            timeDiffStr = "Just now"
          } else {
            timeDiffStr = Math.round(timeDiff.seconds) + " seconds ago";
          }
        }

        comments[i].diff = timeDiffStr;

        // don't show author if same person commenting again within 5 minutes

        if (i > 0) {
          var timeSince = ((new Date(comments[i].created_at)).getTime() -
              (new Date(comments[i-1].created_at))) / 1000;

          if (timeSince < 300) {
            comments[i].minutesSinceLast = Math.floor(timeSince / 60) % 60;
          }

          if ((comments[i - 1].created_by == comments[i].created_by) && comments[i].minutesSinceLast < 5) {
            comments[i].author = false;
          } else {
            comments[i].author = true;
          }
        } else {
          comments[0].author = true;
        }
      }
    }

    function getTimeDifference(createdAt) {
      var delta = ((new Date).getTime() - (createdAt).getTime()) / 1000;

      // TODO : years

      var days = Math.floor(delta / 86400);
      delta -= days * 86400;

      var hours = Math.floor(delta / 3600) % 24;
      delta -= hours * 3600;

      var minutes = Math.floor(delta / 60) % 60;
      delta -= minutes * 60;

      var seconds = delta % 60;

      return {
        days    : days,
        hours   : hours,
        minutes : minutes,
        seconds : seconds
      }
    }
  }


  /* ---------------------------------------------------------------------------
   *  a t t a c h m e n t s
   */

  function AttachmentsCache() {
    var cache = [];

    return {
      save  : save,
      clear : clear,
      get   : get
    }

    ////////////

    function save(attachments) {
      clear();
      for (var i = 0; i < attachments.length; i++) {
        cache.push(attachments[i]);
      }
    }

    function clear() {
      cache = [];
    }

    function get() {
      return cache;
    }
  }


  /* ---------------------------------------------------------------------------
   *  c a t e g o r i e s
   */

  function Categories() {
    var categories = [
      {
        name: "ACCOMMODATION",
      }, {
        name: "BUSINESS RESEARCH",
      }, {
        name: "CAR RENTAL",
      }, {
        name: "CORPORATE",
      }, {
        name: "FINANCE",
      }, {
        name: "FLIGHTS",
      }, {
        name: "FOOD & DRINK",
      }, {
        name: "GENERAL RESEARCH",
      }, {
        name: "GIFTS",
      }, {
        name: "HEALTH",
      }, {
        name: "HOME & LIVING",
      }, {
        name: "LIFE ADMIN",
      }, {
        name: "OUTSOURCING",
      }, {
        name: "PURCHASING",
      }, {
        name: "SHOPPING RESEARCH",
      }, {
        name: "TRAVEL",
      }, {
        name: "TRAVEL RESEARCH",
      }, {
        name: "UTILITIES"
      }
    ];

    return {
      get : get,
      getCategoryIndexByName : getCategoryIndexByName
    }

    ////////////

    function get() {
      return categories;
    }

    function getCategoryIndexByName(name) {
      for (var i = 0; i < categories.length; i++) {
        if (categories[i].name == name) {
          return i;
        }
      }
      // TODO : else undefined category?
    }
  }

})();
