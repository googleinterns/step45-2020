var customSettings1 = {
    "whoCanAdd": "ALL_MANAGERS_CAN_ADD",	
    "whoCanAddReferences": "NONE",
    "whoCanApproveMembers": "ALL_MANAGERS_CAN_APPROVE",	
    "whoCanApproveMessages": "OWNERS_AND_MANAGERS",	
    "whoCanAssignTopics": "NONE",	
    "whoCanAssistContent": "NONE",	
    "whoCanBanUsers": "OWNERS_AND_MANAGERS",	
    "whoCanContactOwner": "ANYONE_CAN_CONTACT",	
    "whoCanDeleteAnyPost": "OWNERS_AND_MANAGERS",	
    "whoCanDeleteTopics": "OWNERS_AND_MANAGERS",	
    "whoCanDiscoverGroup": "ALL_IN_DOMAIN_CAN_DISCOVER",	
    "whoCanEnterFreeFormTags": "NONE",	
    "whoCanHideAbuse": "NONE",	
    "whoCanInvite": "ALL_MANAGERS_CAN_INVITE",
    "whoCanJoin": "CAN_REQUEST_TO_JOIN",
    "whoCanLeaveGroup": "ALL_MEMBERS_CAN_LEAVE",	
    "whoCanLockTopics": "OWNERS_AND_MANAGERS",	
    "whoCanMakeTopicsSticky": "NONE",	
    "whoCanMarkDuplicate": "NONE",	
    "whoCanMarkFavoriteReplyOnAnyTopic": "NONE",	
    "whoCanMarkFavoriteReplyOnOwnTopic": "NONE",	
    "whoCanMarkNoResponseNeeded": "NONE",	
    "whoCanModerateContent": "OWNERS_AND_MANAGERS",	
    "whoCanModerateMembers": "OWNERS_AND_MANAGERS",	
    "whoCanModifyMembers": "NONE",	
    "whoCanModifyTagsAndCategories": "NONE",	
    "whoCanMoveTopicsIn": "OWNERS_AND_MANAGERS",	
    "whoCanMoveTopicsOut": "OWNERS_AND_MANAGERS",	
    "whoCanPostAnnouncements": "OWNERS_AND_MANAGERS",	
    "whoCanPostMessage": "NONE_CAN_POST",	
    "whoCanTakeTopics": "NONE",	
    "whoCanUnassignTopic": "NONE",	
    "whoCanUnmarkFavoriteReplyOnAnyTopic": "NONE",
    "whoCanViewGroup": "ALL_MANAGERS_CAN_VIEW",
    "whoCanViewMembership": "ALL_MEMBERS_CAN_VIEW",
};
var customSettings2 = {
    "whoCanAdd": "ALL_MANAGERS_CAN_ADD",	
    "whoCanAddReferences": "NONE",
    "whoCanApproveMembers": "ALL_MANAGERS_CAN_APPROVE",	
    "whoCanApproveMessages": "OWNERS_AND_MANAGERS",	
    "whoCanAssignTopics": "NONE",	
    "whoCanAssistContent": "NONE",	
    "whoCanBanUsers": "OWNERS_AND_MANAGERS",	
    "whoCanContactOwner": "ANYONE_CAN_CONTACT",	
    "whoCanDeleteAnyPost": "OWNERS_AND_MANAGERS",	
    "whoCanDeleteTopics": "OWNERS_AND_MANAGERS",	
    "whoCanDiscoverGroup": "ALL_IN_DOMAIN_CAN_DISCOVER",	
    "whoCanEnterFreeFormTags": "NONE",	
    "whoCanHideAbuse": "NONE",	
    "whoCanInvite": "ALL_MANAGERS_CAN_INVITE",
    "whoCanJoin": "CAN_REQUEST_TO_JOIN",
    "whoCanLeaveGroup": "ALL_MEMBERS_CAN_LEAVE",	
    "whoCanLockTopics": "OWNERS_AND_MANAGERS",	
    "whoCanMakeTopicsSticky": "NONE",	
    "whoCanMarkDuplicate": "NONE",	
    "whoCanMarkFavoriteReplyOnAnyTopic": "NONE",	
    "whoCanMarkFavoriteReplyOnOwnTopic": "NONE",	
    "whoCanMarkNoResponseNeeded": "NONE",	
    "whoCanModerateContent": "OWNERS_AND_MANAGERS",	
    "whoCanModerateMembers": "OWNERS_AND_MANAGERS",	
    "whoCanModifyMembers": "NONE",	
    "whoCanModifyTagsAndCategories": "NONE",	
    "whoCanMoveTopicsIn": "OWNERS_AND_MANAGERS",	
    "whoCanMoveTopicsOut": "OWNERS_AND_MANAGERS",	
    "whoCanPostAnnouncements": "OWNERS_AND_MANAGERS",	
    "whoCanPostMessage": "OWNERS_AND_MANAGERS",	
    "whoCanTakeTopics": "NONE",	
    "whoCanUnassignTopic": "NONE",	
    "whoCanUnmarkFavoriteReplyOnAnyTopic": "NONE",
    "whoCanViewGroup": "ALL_MEMBERS_CAN_VIEW",
    "whoCanViewMembership": "ALL_MEMBERS_CAN_VIEW",
}

describe("Test group details sidebar functions", function() {

    it("Test diff function for comparing objects", function(done) {

        $.getScript('/src/main/webapp/scripts/group-details-script.js', function() { 
            var original = {
                "a": "1",
                "b": "2",
                "c": "3",
            };
            var diffValues = {
                "a": "1",
                "b": "4",
                "c": "3",
            };
            var fewerKeys = {
                "a": "1",
                "b": "2",
            };
            var empty = {};

            expect(diff(diffValues, original)).toEqual({"b": "4"});
            expect(diff(original, diffValues)).toEqual({"b": "2"});
            expect(diff(fewerKeys, original)).toEqual({"c": undefined});
            expect(diff(original, fewerKeys)).toEqual({});
            expect(diff(diffValues, fewerKeys)).toEqual({"b": "4"});
            expect(diff(fewerKeys, diffValues)).toEqual({"b": "2", "c": undefined});
            expect(diff(original, empty)).toEqual({});
            expect(diff(empty, original)).toEqual({"a": undefined, "b": undefined, "c": undefined});

            done();
        });
    });

    it("Test get access type based on settings parameter", function(done) {

        $.when(
            $.getScript( '/src/main/webapp/scripts/group-details-script.js' ),
            $.getScript( '/src/main/webapp/scripts/group-constants.js' ),
            $.Deferred(function( deferred ){
                $( deferred.resolve );
            })
        ).done(function(){
            expect(getAccessType(publicSettings)).toEqual("Public");
            expect(getAccessType(teamSettings)).toEqual("Team");
            expect(getAccessType(announcementOnlySettings)).toEqual("Announcement Only");
            expect(getAccessType(restrictedSettings)).toEqual("Restricted");
            expect(getAccessType(customSettings1)).toEqual("Custom");
            expect(getAccessType(customSettings2)).toEqual("Custom");

            done();
        });
    });
});
