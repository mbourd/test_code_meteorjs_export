import { check } from 'meteor/check';
import { exportsCollection } from '../db/exportsCollection';
import * as _ from 'underscore';

Meteor.methods({
  'exports.insert'(progress, urlText, createdAt) {
    check(urlText, String);
    check(progress, Number);

    return exportsCollection.insert({
      progress, result: urlText, createdAt, inProgress : false
    });
  },

  'exports.insertAndStartExport'() {
    let id = Meteor.call('exports.insert', 0, '', new Date());
    Meteor.call('exports.updateInterval', id);
  },

  'exports.update'(exportId, progress, urlText = "", inProgress = true) {
    check(exportId, String);
    check(urlText, String);
    check(progress, Number);
    check(inProgress, Boolean);

    let oExport = exportsCollection.findOne({ _id: exportId });

    if (!oExport) {
      throw new Meteor.Error('Export not existing.');
    }

    exportsCollection.update(exportId, {
      $set: {
        progress, result : urlText, inProgress
      }
    })
  },

  'exports.updateInterval'(exportId) {
    check(exportId, String);

    let oExport = exportsCollection.findOne({ _id: exportId });

    if (!oExport) {
      throw new Meteor.Error('Export not existing.');
    }

    if (oExport.progress < 100 && !oExport.inProgress) {
      let newProgress = oExport.progress;

      let hInterval = Meteor.setInterval(() => {
        newProgress = newProgress + 5;

        Meteor.call('exports.update', exportId, newProgress);

        if (newProgress >= 100) {
          let randUrl = Meteor.call('urls.getRandomURL').text;

          Meteor.call('exports.update', exportId, 100, randUrl, false);
          Meteor.clearInterval(hInterval);
        }
      }, 1000);
    }

  },
})