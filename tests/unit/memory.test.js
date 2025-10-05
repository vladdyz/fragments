// Unit test for the /src/mode/data/memory/index.js module
const {
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  listFragments,
  deleteFragment,
} = require('../../src/model/data/memory/index');

describe('memory/index', () => {
  // fragment is included with an HTTP response and consists of binary blob data and metadata,
  // expect metadata to have key-value pairs including:
  // id, ownerId, created, updated, type, size
  test('Testing the writeFragment/readFragment functions', async () => {
    let fragment = {
      id: '30a84843-0cd4-4975-95ba-b96112aea189',
      ownerId: '11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a',
      type: 'image/png',
    };
    await writeFragment(fragment);
    const stored = await readFragment(
      '11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a',
      '30a84843-0cd4-4975-95ba-b96112aea189'
    );
    expect(stored).toEqual(fragment);
  });
  // same owner id/id for read should return the buffer data written
  test('Testing the writeFragmentData/readFragmentData data buffer storage & retrieval', async () => {
    const buffer = Buffer.from('test data');
    await writeFragmentData('testuser', 'testid', buffer);
    const result = await readFragmentData('testuser', 'testid');
    expect(result).toEqual(buffer);
  });
  // Get a list of fragment ids/objects for the given user from memory db
  // case 1: optional expand arg is false, only IDs are returned
  test('ListFragments Case 1: Return only fragment IDs for a given user', async () => {
    await writeFragment({
      ownerId: '21d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a',
      id: 'firstFragment',
    });
    await writeFragment({
      ownerId: '21d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a',
      id: 'secondFragment',
    });
    // this belongs to a different user and should not be returned
    await writeFragment({ ownerId: 'ANOTHER USER', id: 'thirdFragment' });
    const fragments = await listFragments(
      '21d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a'
    );
    expect(fragments).toEqual(['firstFragment', 'secondFragment']);
  });
  // case 2: expand arg is true, return all data
  test('ListFragments Case 2: Return expanded fragments for a given user', async () => {
    let fragment = {
      id: '30a84843-0cd4-4975-95ba-b96112aea189',
      ownerId: '51d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a',
      type: 'image/png',
    };
    let fragment2 = {
      id: '21040302-09cap33fl-242f-b92v9skka32',
      ownerId: '51d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a',
      type: 'text/csv',
    };
    // this one belongs to another user, shouldn't be returned
    let fragment3 = {
      id: 'DO NOT RETURN THIS',
      ownerId: 'Someone else',
      type: 'application/json',
    };
    await writeFragment(fragment);
    await writeFragment(fragment2);
    await writeFragment(fragment3);
    const fragments = await listFragments(
      '51d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a',
      true
    );
    let expectedResult = [JSON.stringify(fragment), JSON.stringify(fragment2)]; // should compare arrays of strings instead of stringified array
    expect(fragments).toEqual(expectedResult); // JSON.stringify needs to be used inside the array, not stringifying the array itself
  });

  test('Deleting an existing fragment', async () => {
    let toBeDeleted = {
      id: 'DO NOT RETURN THIS',
      ownerId: 'Someone else',
      type: 'application/json',
    };
    // must have both data and metadata entries to delete
    await writeFragment(toBeDeleted);
    await writeFragmentData(toBeDeleted.ownerId, toBeDeleted.id, Buffer.from('some test data'));
    await deleteFragment(toBeDeleted.ownerId, toBeDeleted.id);
    const deletedFragment = await readFragment(toBeDeleted.ownerId, toBeDeleted.id);
    const deletedBuffer = await readFragmentData(toBeDeleted.ownerId, toBeDeleted.id);
    expect(deletedFragment).toBeUndefined();
    expect(deletedBuffer).toBeUndefined();
  });
});
