# Generated by Django 5.1.4 on 2025-01-22 17:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('expense_tracker', '0009_expense_group_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='settlement',
            name='payment_status',
            field=models.CharField(choices=[('Pending', 'Pending'), ('Completed', 'Completed')], default='Pending', max_length=50),
        ),
    ]
