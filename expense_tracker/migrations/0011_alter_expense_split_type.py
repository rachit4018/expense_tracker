# Generated by Django 5.1.4 on 2025-01-22 17:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('expense_tracker', '0010_alter_settlement_payment_status'),
    ]

    operations = [
        migrations.AlterField(
            model_name='expense',
            name='split_type',
            field=models.CharField(choices=[('equal', 'Equal')], max_length=50),
        ),
    ]
