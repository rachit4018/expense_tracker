from django.test import TestCase
from rest_framework.test import APIClient
from .models import Group, CustomUser, Expense

class GroupDetailsAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(username='testuser', password='testpass', college='Test College')
        self.group = Group.objects.create(name='Test Group', created_by=self.user)
        self.group.members.add(self.user)
        self.expense = Expense.objects.create(category_id=self.group.id, amount=100, created_by=self.user)

def test_get_group_details_success(self):
    # Authenticate the user
    self.client.force_authenticate(user=self.user)

    # Set the username in the headers
    headers = {'HTTP_X_Username': self.user.username}

    # Make the GET request to the GroupDetailsAPIView
    response = self.client.get(f'/api/groups/{self.group.id}/', **headers)

    # Assert the response status code is 200 OK
    self.assertEqual(response.status_code, 200)

    # Assert the response contains the group details
    self.assertIn('group', response.data)
    self.assertEqual(response.data['group']['id'], self.group.id)
    self.assertEqual(response.data['group']['name'], self.group.name)

    # Assert the response contains the expenses
    self.assertIn('expenses', response.data)
    self.assertEqual(len(response.data['expenses']), 1)
    self.assertEqual(response.data['expenses'][0]['amount'], self.expense.amount)

    # Assert the response contains available members from the same college
    self.assertIn('available_members', response.data)
    self.assertEqual(response.data['available_members'][0]['username'], self.user.username)
